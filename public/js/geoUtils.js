// js/geoUtils.js
export function getSelectedRadioValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || null;
}
