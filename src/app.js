import { calculateEstimate, convertDisplayUnits, toMetricInputs, CalculationError } from './calculator.js';

const dictionary = {
  en: {
    units: { metric: ['m', 'mm', 'mm', 'L'], imperial: ['ft', 'in', 'in', 'ft³'] },
    validation: 'Enter a valid number within the permitted range.',
    missing: 'This value is required.',
    outOfRange: 'Value is outside the permitted range.',
    resultsAvailable: 'Estimate updated.',
    resultsIncomplete: 'Complete the required fields to see an estimate.',
  },
  es: {
    units: { metric: ['m', 'mm', 'mm', 'L'], imperial: ['pies', 'pulg.', 'pulg.', 'pies³'] },
    validation: 'Introduce un número válido dentro del rango permitido.',
    missing: 'Este valor es obligatorio.',
    outOfRange: 'El valor está fuera del rango permitido.',
    resultsAvailable: 'Estimación actualizada.',
    resultsIncomplete: 'Completa los campos obligatorios para ver una estimación.',
  },
};
const locale = document.documentElement.lang === 'es' ? 'es' : 'en';
const txt = dictionary[locale];
const form = document.querySelector('#calculator');
const unitSelect = document.querySelector('#units');
const fields = ['length', 'width', 'depth', 'yield', 'utilization', 'waste'];
const inputNodes = Object.fromEntries(fields.map(key => [key, document.querySelector(`#${key}`)]));
const errorNodes = Object.fromEntries(fields.map(key => [key, document.querySelector(`#error-${key}`)]));
const canCount = document.querySelector('#result-cans');
const volume = document.querySelector('#result-volume');
const usable = document.querySelector('#result-usable');
const status = document.querySelector('#form-status');
const resultDescription = document.querySelector('#result-description');
const placeholder = '—';
let currentUnits = 'metric';

function values() {
  return Object.fromEntries(fields.map(key => [key, inputNodes[key].value.trim()]));
}
function clearErrors() {
  for (const key of fields) {
    inputNodes[key].removeAttribute('aria-invalid');
    errorNodes[key].textContent = '';
  }
}
function showPlaceholders() {
  canCount.textContent = placeholder;
  volume.textContent = placeholder;
  usable.textContent = placeholder;
}
function formatValue(number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    maximumFractionDigits,
  }).format(number);
}
function displayCalculation() {
  clearErrors();
  try {
    const metrics = toMetricInputs(values(), currentUnits);
    const result = calculateEstimate(metrics);
    canCount.textContent = formatValue(result.cans, 0);
    volume.textContent = `${formatValue(result.volumeLiters, 4)} L`;
    usable.textContent = `${formatValue(result.usableYieldLiters, 4)} L`;
    status.textContent = txt.resultsAvailable;
    resultDescription.hidden = false;
  } catch (error) {
    showPlaceholders();
    resultDescription.hidden = true;
    status.textContent = txt.resultsIncomplete;
    if (error instanceof CalculationError) {
      // SI input error field names differ from display field names.
      const translation = {
        lengthMeters: 'length', gapWidthMm: 'width', gapDepthMm: 'depth',
        yieldLiters: 'yield', utilizationPercent: 'utilization', wastePercent: 'waste',
      };
      const field = translation[error.field] ?? error.field;
      if (inputNodes[field]) {
        inputNodes[field].setAttribute('aria-invalid', 'true');
        errorNodes[field].textContent = error.code === 'missing' ? txt.missing
          : error.code === 'out-of-range' ? txt.outOfRange : txt.validation;
      }
    }
  }
}
function renderUnitLabels() {
  ['length', 'width', 'depth', 'yield'].forEach((key, index) => {
    document.querySelector(`#unit-${key}`).textContent = txt.units[currentUnits][index];
  });
}
unitSelect.addEventListener('change', () => {
  const next = unitSelect.value;
  const nextValues = convertDisplayUnits(values(), currentUnits, next);
  currentUnits = next;
  for (const key of fields) inputNodes[key].value = nextValues[key];
  renderUnitLabels();
  displayCalculation();
});
form.addEventListener('input', displayCalculation);
form.addEventListener('submit', (event) => event.preventDefault());
renderUnitLabels();
displayCalculation();
