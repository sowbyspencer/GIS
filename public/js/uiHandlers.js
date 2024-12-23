// js/uiHandlers.js
export function attachUIHandlers(view, createServiceAreasCallback) {
  // Example: Button click for service area calculation
  document
    .querySelector('input[type="button"]')
    .addEventListener("click", () => {
      const center = view.center;
      createServiceAreasCallback(center);
    });

  // Example: Handle form interactions
  document.querySelector(".inputForm").addEventListener("keydown", (event) => {
    if (event.target.matches("input") && event.key === "Enter") {
      event.preventDefault();
      const inputs = [...event.target.form.querySelectorAll("input")];
      const nextInput = inputs[inputs.indexOf(event.target) + 1];
      nextInput?.focus() ||
        event.target.form.querySelector('input[type="button"]').click();
    }
  });
}
