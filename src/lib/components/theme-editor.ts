import "$components/color-picker.js";
import {
  type Colors,
  type CustomTheme,
  MAX_NAME_LENGTH,
  colorFields,
  isCssColor,
  isTheme,
} from "$theme/theme-schema.js";
import { LitElement, css, html, nothing } from "lit";
import { announce, controlStyles, inputValue, selectOptions } from "$components/shared-ui.js";
import { colorSchemes, getColorScheme } from "$theme/built-in-themes.js";
import { applyCustomTheme } from "$theme/theme.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { readCurrentColors } from "$theme/color-utils.js";

export class ThemeEditor extends LitElement {
  static styles = [
    controlStyles,
    css`
      :host {
        display: block;
        color: var(--color-text);
        font-family: inherit;
      }
      form {
        display: grid;
        gap: 0.65rem;
      }
      label {
        font-size: 0.875rem;
        font-weight: 600;
      }
      input {
        font: inherit;
        color: inherit;
        border: 1px solid var(--color-border);
        background-color: var(--color-surface);
        border-radius: 0.4rem;
      }
      input {
        box-sizing: border-box;
        min-width: 0;
        width: 100%;
        padding: 0.65rem;
      }

      input:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }
      form > p {
        color: var(--color-muted);
        font-size: 0.875rem;
        line-height: 1.5;
        margin: 0 0 0.5rem;
      }
      .base-selectors {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 0.75rem;
      }
      @media (max-width: 24rem) {
        .base-selectors {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      .colors {
        display: grid;
        gap: 0.65rem;
        margin-block: 0.5rem;
      }
      .colors > div {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 0.5rem;
        align-items: center;
      }
      .colors p {
        margin: 0;
        font-size: 0.8125rem;
      }
      .colors > div > input {
        font-family: ui-monospace, monospace;
        font-size: 0.875rem;
      }
      .form-actions {
        display: grid;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding-top: 1rem;
        border-top: 1px solid var(--color-border);
      }
      .form-actions > div {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.625rem;
      }
    `,
  ];

  static properties = {
    draft: { state: true },
    entered: { state: true },
    errors: { state: true },
    initial: { attribute: false },
    resolved: { state: true },
  };

  initial: CustomTheme = { base: "light", colors: {}, id: "", name: "" };
  draft: CustomTheme = { base: "light", colors: {}, id: "", name: "" };
  resolved: Partial<Colors> | null = null;
  entered: Partial<Colors> = {};
  errors: Partial<Colors> = {};

  get hasErrors(): boolean {
    return Object.values(this.errors).some(Boolean);
  }

  firstUpdated(): void {
    this.draft = { ...this.initial, colors: { ...this.initial.colors } };
    this.entered = { ...this.initial.colors };
    this.preview();
    void this.updateComplete.then(() => this.shadowRoot?.getElementById("theme-name")?.focus());
  }

  preview(): void {
    applyCustomTheme(this.draft);
    this.resolved = readCurrentColors();
  }

  changeColor(key: keyof Colors, value: string): void {
    this.entered = { ...this.entered, [key]: value };
    if (!isCssColor(value)) {
      this.errors = { ...this.errors, [key]: "Enter a CSS color supported by this browser." };
      return;
    }
    this.errors = { ...this.errors, [key]: "" };
    this.draft = { ...this.draft, colors: { ...this.draft.colors, [key]: value.trim() } };
    this.preview();
  }

  reset(): void {
    this.draft = { ...this.draft, colors: {} };
    this.entered = {};
    this.errors = {};
    this.preview();
  }

  save(event: SubmitEvent): void {
    event.preventDefault();
    if (!this.hasErrors && this.draft.name.trim()) {
      announce(this, "theme-save", { ...this.draft, name: this.draft.name.trim() });
    }
  }

  renderColor(field: (typeof colorFields)[number]) {
    const id = `theme-${field.key}-color`;
    return html`
      <div>
        <label for=${id}>${field.label}</label>
        <color-picker
          .label=${field.label}
          .value=${this.resolved?.[field.key] ?? "oklch(0 0 0)"}
          @color-change=${(event: CustomEvent<string>) => {
            this.changeColor(field.key, event.detail);
          }}
        ></color-picker>
        <input
          id=${id}
          aria-label=${`${field.label} CSS color`}
          .value=${live(this.entered[field.key] ?? this.resolved?.[field.key] ?? "")}
          aria-invalid=${String(!!this.errors[field.key])}
          aria-describedby=${ifDefined(this.errors[field.key] ? `theme-${field.key}-error` : undefined)}
          required
          spellcheck="false"
          @input=${(event: Event) => {
            this.changeColor(field.key, inputValue(event));
          }}
        />
        ${this.errors[field.key] ? html`<p id=${`theme-${field.key}-error`} role="alert">${this.errors[field.key]}</p>` : nothing}
      </div>
    `;
  }

  render() {
    return html`
      <form @submit=${this.save}>
        <p>Preview changes across the page. Save to keep them.</p>
        <label
          >Theme name
          <input
            id="theme-name"
            .value=${live(this.draft.name)}
            maxlength=${MAX_NAME_LENGTH}
            required
            autocomplete="off"
            @input=${(event: Event) => {
              this.draft = { ...this.draft, name: inputValue(event) };
            }}
          />
        </label>
        <div class="base-selectors">
          <label for="theme-base-appearance"
            >Base appearance
            <span class="select-control"
              ><select
                id="theme-base-appearance"
                aria-describedby="theme-base-help"
                .value=${live(this.draft.base)}
                @change=${(event: Event) => {
                  const base = inputValue(event);
                  if (isTheme(base)) {
                    this.draft = { ...this.draft, base };
                    this.reset();
                  }
                }}
              >
                ${selectOptions(
                  [
                    { label: "Light", value: "light" },
                    { label: "Dark", value: "dark" },
                  ],
                  this.draft.base,
                )}
              </select></span
            >
          </label>
          <label for="theme-base-scheme"
            >Base color scheme
            <span class="select-control"
              ><select
                id="theme-base-scheme"
                aria-describedby="theme-base-help"
                .value=${live(this.draft.baseScheme ?? "classic")}
                @change=${(event: Event) => {
                  const scheme = getColorScheme(inputValue(event));
                  if (scheme) {
                    this.draft = { ...this.draft, baseScheme: scheme.id };
                    this.reset();
                  }
                }}
              >
                ${selectOptions(
                  colorSchemes.map((scheme) => ({ label: scheme.name, value: scheme.id })),
                  this.draft.baseScheme ?? "classic",
                )}
              </select></span
            >
          </label>
        </div>
        <p id="theme-base-help">
          Changing either base replaces the current colors with that palette. Save to keep the
          result.
        </p>
        <p>
          Adjust lightness, chroma, hue, and opacity in OKLCH, or enter any CSS color your browser
          supports.
        </p>
        ${this.resolved ? html`<div class="colors">${colorFields.map((field) => this.renderColor(field))}</div>` : nothing}
        <div class="form-actions">
          <div>
            <button
              type="button"
              data-variant="secondary"
              @click=${() => {
                announce(this, "theme-cancel", null);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-variant="primary"
              ?disabled=${!this.draft.name.trim() || this.hasErrors}
            >
              Save theme
            </button>
          </div>
          <button type="button" data-variant="quiet" @click=${this.reset}>Reset colors</button>
        </div>
      </form>
    `;
  }
}
customElements.define("theme-editor", ThemeEditor);
