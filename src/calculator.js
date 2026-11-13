/**
 * Dependency-free quantity estimation. Inputs are measurements, not product claims.
 * Use named SI units internally and convert only at the boundary.
 */
export const FOOT_IN_METERS = 0.3048;
export const INCH_IN_MM = 25.4;
export const CUBIC_FOOT_IN_LITERS = 28.316846592;

const LIMITS = {
  lengthMeters: { min: 0, max: 1_000_000, exclusiveMin: true },
  gapWidthMm: { min: 0, max: 10_000, exclusiveMin: true },
  gapDepthMm: { min: 0, max: 10_000, exclusiveMin: true },
  yieldLiters: { min: 0.01, max: 100_000 },
  utilizationPercent: { min: 1, max: 100 },
  wastePercent: { min: 0, max: 100 },
};

export class CalculationError extends Error {
  constructor(field, code = 'invalid') {
    super(`${field}: ${code}`);
    this.name = 'CalculationError';
    this.field = field;
    this.code = code;
  }
}

function numberInRange(field, value) {
  // In particular, do not coerce an empty string to zero.
  if (value === '' || value === null || value === undefined || typeof value === 'boolean') {
    throw new CalculationError(field, 'missing');
  }
  const number = Number(value);
  if (!Number.isFinite(number)) throw new CalculationError(field, 'not-number');
  const { min, max, exclusiveMin } = LIMITS[field];
  if ((exclusiveMin ? number <= min : number < min) || number > max) {
    throw new CalculationError(field, 'out-of-range');
  }
  return number;
}

/** Convert display values to SI measurements. */
export function toMetricInputs(values, unitSystem = 'metric') {
  if (unitSystem !== 'metric' && unitSystem !== 'imperial') {
    throw new CalculationError('unitSystem', 'invalid');
  }
  const factor = unitSystem === 'imperial' ? FOOT_IN_METERS : 1;
  const mmFactor = unitSystem === 'imperial' ? INCH_IN_MM : 1;
  const volumeFactor = unitSystem === 'imperial' ? CUBIC_FOOT_IN_LITERS : 1;
  const fields = ['length', 'width', 'depth', 'yield', 'utilization', 'waste'];
  const parsed = {};
  for (const field of fields) {
    if (values[field] === '' || values[field] === null || values[field] === undefined) {
      throw new CalculationError(field, 'missing');
    }
    const n = Number(values[field]);
    if (!Number.isFinite(n)) throw new CalculationError(field, 'not-number');
    parsed[field] = n;
  }
  return {
    lengthMeters: parsed.length * factor,
    gapWidthMm: parsed.width * mmFactor,
    gapDepthMm: parsed.depth * mmFactor,
    yieldLiters: parsed.yield * volumeFactor,
    utilizationPercent: parsed.utilization,
    wastePercent: parsed.waste,
  };
}

/** Calculate required whole cans; no manufacturer or project yield is implied. */
export function calculateEstimate(siInputs) {
  const validated = {};
  for (const key of Object.keys(LIMITS)) validated[key] = numberInRange(key, siInputs[key]);
  const volumeLiters = (
    validated.lengthMeters * validated.gapWidthMm * validated.gapDepthMm / 1000
  );
  const usableYieldLiters = validated.yieldLiters * validated.utilizationPercent / 100;
  const adjustedVolumeLiters = volumeLiters * (1 + validated.wastePercent / 100);
  const rawCanCount = adjustedVolumeLiters / usableYieldLiters;
  if (!Number.isFinite(rawCanCount) || rawCanCount > Number.MAX_SAFE_INTEGER) {
    throw new CalculationError('quantity', 'out-of-range');
  }
  return {
    volumeLiters,
    usableYieldLiters,
    adjustedVolumeLiters,
    cans: Math.ceil(rawCanCount),
  };
}

export function estimateFromDisplay(values, unitSystem = 'metric') {
  return calculateEstimate(toMetricInputs(values, unitSystem));
}

/** Change displayed units while preserving physical measurements. */
export function convertDisplayUnits(values, from, to) {
  if (from === to) return { ...values };
  if (!['metric', 'imperial'].includes(from) || !['metric', 'imperial'].includes(to)) {
    throw new CalculationError('unitSystem', 'invalid');
  }
  const toImperial = from === 'metric';
  const factors = {
    length: FOOT_IN_METERS,
    width: INCH_IN_MM,
    depth: INCH_IN_MM,
    yield: CUBIC_FOOT_IN_LITERS,
  };
  const converted = { ...values };
  for (const [key, factor] of Object.entries(factors)) {
    if (values[key] !== '' && values[key] != null && Number.isFinite(Number(values[key]))) {
      const result = toImperial ? Number(values[key]) / factor : Number(values[key]) * factor;
      converted[key] = Number(result.toPrecision(12)).toString();
    }
  }
  return converted;
}
