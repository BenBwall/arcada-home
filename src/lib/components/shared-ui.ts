import { css, html } from "lit";

export const controlStyles = css`
  button[data-variant] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 2.75rem;
    padding: 0.625rem 0.875rem;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.4;
    color: var(--color-text);
    background-color: color-mix(in srgb, var(--color-text) 7%, var(--color-surface));
    border: 1px solid var(--color-border-strong);
    border-radius: 0.5rem;
    cursor: pointer;
  }

  button[data-variant]:enabled:hover {
    background-color: color-mix(in srgb, var(--color-text) 12%, var(--color-surface));
  }

  button[data-variant]:enabled:active {
    background-color: var(--color-active);
  }

  button[data-variant][data-variant="primary"] {
    color: var(--color-surface);
    background-color: var(--color-text);
    border-color: var(--color-text);
  }

  button[data-variant][data-variant="primary"]:enabled:hover {
    background-color: color-mix(in srgb, var(--color-text) 85%, var(--color-surface));
  }

  button[data-variant][data-variant="quiet"] {
    color: var(--color-muted);
    background-color: transparent;
    border-color: transparent;
  }

  button[data-variant][data-variant="quiet"]:enabled:hover {
    color: var(--color-text);
    background-color: var(--color-hover);
  }

  button[data-variant]:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  button[data-variant]:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .select-control {
    display: block;
    position: relative;
    margin-top: 0.5rem;
  }

  .select-control::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 0.7rem;
    width: 0.6rem;
    height: 0.3rem;
    background-color: currentColor;
    clip-path: polygon(0 0, 100% 0, 50% 100%);
    translate: 0 -50%;
    rotate: 0deg;
    pointer-events: none;
  }

  .select-control:has(select:open)::after {
    rotate: 180deg;
  }

  @media (prefers-reduced-motion: no-preference) {
    .select-control::after {
      transition: rotate 300ms ease;
    }
  }

  select {
    appearance: none;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    min-height: 2.75rem;
    padding: 0.5rem 2.25rem 0.5rem 0.75rem;
    font: inherit;
    color: inherit;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.4rem;
    cursor: pointer;
  }

  select:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  select option {
    color: var(--color-text);
    background-color: var(--color-surface);
  }
`;

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
