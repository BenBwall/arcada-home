import { SunMoon, X } from "@lucide/icons";
import { css, html } from "lit";
import { buildLucideSvg } from "@lucide/icons/build";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

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

// These SVG strings come from the installed Lucide package, on both server and client.
const APPEARANCE_STROKE_WIDTH = 1.5;
const CLOSE_ICON_SIZE = 20;

export const sunMoonIcon = () =>
  unsafeHTML(
    buildLucideSvg(SunMoon, {
      hasA11yProp: false,
      size: "100%",
      strokeWidth: APPEARANCE_STROKE_WIDTH,
    }),
  );
export const closeIcon = () =>
  unsafeHTML(buildLucideSvg(X, { hasA11yProp: false, size: CLOSE_ICON_SIZE }));
