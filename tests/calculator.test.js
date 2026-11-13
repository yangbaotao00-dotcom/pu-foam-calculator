import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEstimate, toMetricInputs, estimateFromDisplay,
  convertDisplayUnits, FOOT_IN_METERS, INCH_IN_MM, CUBIC_FOOT_IN_LITERS,
  CalculationError,
} from '../src/calculator.js';

const base = {
  lengthMeters: 100, gapWidthMm: 20, gapDepthMm: 50,
  yieldLiters: 40, utilizationPercent: 75, wastePercent: 10,
};
const display = { length: '100', width: '20', depth: '50', yield: '40', utilization: '75', waste: '10' };
const closeTo = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not close to ${expected}`);
const failField = (inputs, field) => assert.throws(() => calculateEstimate(inputs), e => e instanceof CalculationError && e.field === field);

test('01 metric joint volume formula: 100 m × 20 mm × 50 mm = 100 L', () => {
  closeTo(calculateEstimate(base).volumeLiters, 100);
});
test('02 apply assumed utilization to nominal free-foam yield', () => {
  closeTo(calculateEstimate(base).usableYieldLiters, 30);
});
test('03 apply waste allowance and round cans upward', () => {
  const r = calculateEstimate(base); closeTo(r.adjustedVolumeLiters, 110); assert.equal(r.cans, 4);
});
test('04 exact integer can count must not add another can', () => {
  assert.equal(calculateEstimate({ ...base, lengthMeters: 30, wastePercent: 0 }).cans, 1);
});
test('05 round fractional can count upward', () => {
  assert.equal(calculateEstimate({ ...base, lengthMeters: 30.01, wastePercent: 0 }).cans, 2);
});
test('06 zero waste allowance is valid', () => {
  closeTo(calculateEstimate({ ...base, wastePercent: 0 }).adjustedVolumeLiters, 100);
});
test('07 full utilization is valid', () => {
  closeTo(calculateEstimate({ ...base, utilizationPercent: 100 }).usableYieldLiters, 40);
});
test('08 1 foot converts exactly to 0.3048 meters', () => {
  closeTo(toMetricInputs({ ...display, length: 1 }, 'imperial').lengthMeters, FOOT_IN_METERS);
});
test('09 1 inch converts exactly to 25.4 millimeters', () => {
  closeTo(toMetricInputs({ ...display, width: 1 }, 'imperial').gapWidthMm, INCH_IN_MM);
});
test('10 1 cubic foot converts to 28.316846592 liters', () => {
  closeTo(toMetricInputs({ ...display, yield: 1 }, 'imperial').yieldLiters, CUBIC_FOOT_IN_LITERS);
});
test('11 equivalent metric and imperial display inputs give same can count', () => {
  const metric = estimateFromDisplay(display, 'metric');
  const imperial = estimateFromDisplay(convertDisplayUnits(display, 'metric', 'imperial'), 'imperial');
  assert.equal(metric.cans, imperial.cans); closeTo(metric.volumeLiters, imperial.volumeLiters, 1e-7);
});
test('12 switching metric to imperial and back preserves physical measurements', () => {
  const roundTrip = convertDisplayUnits(convertDisplayUnits(display, 'metric', 'imperial'), 'imperial', 'metric');
  for (const key of ['length', 'width', 'depth', 'yield']) closeTo(Number(roundTrip[key]), Number(display[key]), 1e-7);
});
test('13 required nominal free-foam yield cannot be empty', () => {
  assert.throws(() => toMetricInputs({ ...display, yield: '' }), e => e instanceof CalculationError && e.field === 'yield');
});
test('14 zero or negative physical measurements are invalid', () => {
  failField({ ...base, lengthMeters: 0 }, 'lengthMeters');
  failField({ ...base, gapWidthMm: -2 }, 'gapWidthMm');
});
test('15 percentages and non-finite values outside limits are rejected', () => {
  failField({ ...base, utilizationPercent: 0 }, 'utilizationPercent');
  failField({ ...base, wastePercent: 101 }, 'wastePercent');
  failField({ ...base, yieldLiters: Number.POSITIVE_INFINITY }, 'yieldLiters');
});
