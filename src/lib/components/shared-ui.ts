import { asset } from "$site/paths.js";
import { html } from "lit";

export const stylesheets = (...names: string[]) =>
  names.map((name) => html` <link rel="stylesheet" href=${asset(`_app/styles/${name}.css`)} /> `);

export const selectOptions = (
  options: readonly { value: string; label: string }[],
  selected: string,
) =>
  options.map(
    (option) =>
      html`<option value=${option.value} ?selected=${option.value === selected}>
        ${option.label}
      </option>`,
  );

export const getInput = (event: Event): HTMLInputElement => {
  if (!(event.currentTarget instanceof HTMLInputElement)) {
    throw new Error("Expected an input event.");
  }
  return event.currentTarget;
};

export const inputValue = (event: Event): string => {
  const control = event.currentTarget;
  if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) {
    throw new Error("Expected a form control event.");
  }
  return control.value;
};

export const announce = (element: HTMLElement, type: string, detail: unknown): void => {
  element.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
};

// Lucide SunMoon and X icon geometry; see THIRD_PARTY_NOTICES.txt.
export const sunMoonIcon = () => html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2v2"></path>
    <path
      d="M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715"
    ></path>
    <path d="M16 12a4 4 0 0 0-4-4"></path>
    <path d="m19 5-1.256 1.256"></path>
    <path d="M20 12h2"></path>
  </svg>
`;
export const closeIcon = () =>
  html`<svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <path d="m18 6-12 12M6 6l12 12"></path>
  </svg>`;
