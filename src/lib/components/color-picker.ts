import { LitElement, css, html, nothing } from "lit";
import { announce, getInput } from "$components/shared-ui.js";
import { formatOklch, oklchChannels } from "$theme/color-utils.js";
import { live } from "lit/directives/live.js";

const PERCENT_MAX = 100;
const HUE_MAX = 360;
const CHROMA_MAX = 0.5;
const PERCENT_STEP = 0.1;
const CHROMA_STEP = 0.001;
const channels = ["Lightness", "Chroma", "Hue", "Opacity"];
const units = [" %", "", " °", " %"];
const steps = [PERCENT_STEP, CHROMA_STEP, 1, PERCENT_STEP];
const maxima = [PERCENT_MAX, CHROMA_MAX, HUE_MAX, PERCENT_MAX];

export class ColorPicker extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: var(--color-text);
      font-family: inherit;
    }
    .color-picker {
      min-width: 0;
    }
    button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      min-height: 2.75rem;
      padding: 0.375rem 0.625rem;
      font: inherit;
      font-size: 0.875rem;
      color: var(--color-text);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.4rem;
      cursor: pointer;
    }
    .checkerboard {
      background: repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 / 12px 12px;
    }
    .swatch {
      width: 2.5rem;
      height: 1.75rem;
      overflow: hidden;
      border: 1px solid var(--color-border-strong);
      border-radius: 0.2rem;
    }
    .swatch span {
      display: block;
      height: 100%;
    }
    .opacity {
      margin-left: auto;
      font-variant-numeric: tabular-nums;
    }
    fieldset {
      min-width: 0;
      padding: 0.75rem 0;
      margin: 0;
      border: 0;
    }
    legend {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    .channel {
      display: grid;
      grid-template-columns: 5.25rem minmax(0, 1fr) 4.75rem;
      align-items: center;
      gap: 0.5rem;
      min-height: 2.75rem;
      font-size: 0.8125rem;
    }
    .track {
      height: 1rem;
      border-radius: 1rem;
    }
    input[type="range"] {
      appearance: none;
      display: block;
      width: 100%;
      height: 1rem;
      margin: 0;
      border-radius: 1rem;
      cursor: pointer;
    }
    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid #fff;
      border-radius: 50%;
      background: #333;
      box-shadow: 0 0 0 1px #555;
    }
    input[type="range"]::-moz-range-thumb {
      width: 1rem;
      height: 1rem;
      border: 2px solid #fff;
      border-radius: 50%;
      background: #333;
      box-shadow: 0 0 0 1px #555;
    }
    input[type="number"] {
      appearance: textfield;
      box-sizing: border-box;
      min-width: 0;
      width: 100%;
      padding: 0.5rem 0.25rem;
      font: inherit;
      font-variant-numeric: tabular-nums;
      color: var(--color-text);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0.4rem;
    }
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
      appearance: none;
      margin: 0;
    }
    button:focus-visible,
    input:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 3px;
    }
  `;

  static properties = {
    expanded: { state: true },
    label: { type: String },
    value: { type: String },
  };

  label = "Color";
  value = "oklch(0 0 0)";
  expanded = false;
  editing: { index: number; value: string } | null = null;

  get coordinates() {
    return oklchChannels(this.value);
  }

  gradient(index: number): string {
    const values = index === 2 ? [0, HUE_MAX / 2, HUE_MAX] : [0, maxima[index] ?? PERCENT_MAX];
    const stops = values.map((value) => {
      const next: [number, number, number, number] = [...this.coordinates];
      next[3] = PERCENT_MAX;
      next[index] = value;
      return formatOklch(next);
    });
    const interpolation = index === 2 ? "oklch increasing hue" : "oklch";
    return `linear-gradient(to right in ${interpolation}, ${stops.join(", ")})`;
  }

  change(index: number, input: HTMLInputElement): void {
    if (!Number.isFinite(input.valueAsNumber)) {
      return;
    }
    const next: [number, number, number, number] = [...this.coordinates];
    next[index] = Math.max(0, Math.min(maxima[index] ?? PERCENT_MAX, input.valueAsNumber));
    if (next[index] !== input.valueAsNumber) {
      input.value = String(next[index]);
    }
    announce(this, "color-change", formatOklch(next));
  }

  previewNumber(index: number, input: HTMLInputElement): void {
    // Keep incomplete numeric input under the browser's control while typing.
    this.editing = { index, value: input.value };
    if (input.validity.valid) {
      this.change(index, input);
    }
  }

  commitNumber(index: number, input: HTMLInputElement): void {
    if (!Number.isFinite(input.valueAsNumber)) {
      input.value = String(this.coordinates[index]);
    }
    this.change(index, input);
    this.editing = null;
    this.requestUpdate();
  }

  renderChannel(channel: string, index: number) {
    const id = channel.toLowerCase();
    return html`
      <div class="channel">
        <label for=${id}>${channel}${units[index]}</label>
        <div class="checkerboard track">
          <input
            type="range"
            aria-label=${`${this.label} ${id}`}
            min="0"
            max=${maxima[index]}
            step=${steps[index]}
            .value=${live(String(this.coordinates[index]))}
            style=${`background: ${this.gradient(index)}`}
            @input=${(event: Event) => {
              this.change(index, getInput(event));
            }}
          />
        </div>
        <input
          id=${id}
          type="number"
          aria-label=${`${this.label} ${id} value`}
          min="0"
          max=${maxima[index]}
          step="any"
          required
          .value=${this.editing?.index === index ? this.editing.value : String(this.coordinates[index])}
          @focus=${(event: FocusEvent) => {
            this.editing = { index, value: getInput(event).value };
          }}
          @input=${(event: Event) => {
            this.previewNumber(index, getInput(event));
          }}
          @blur=${(event: FocusEvent) => {
            this.commitNumber(index, getInput(event));
          }}
          @keydown=${(event: KeyboardEvent) => {
            if (event.key === "Enter") {
              event.preventDefault();
              this.commitNumber(index, getInput(event));
            }
          }}
        />
      </div>
    `;
  }

  render() {
    return html`
      <div class="color-picker">
        <button
          type="button"
          aria-label=${`Pick ${this.label.toLowerCase()} color`}
          aria-expanded=${String(this.expanded)}
          aria-controls="channels"
          @click=${() => {
            this.expanded = !this.expanded;
          }}
        >
          <span class="checkerboard swatch" aria-hidden="true"
            ><span style=${`background: ${this.value}`}></span
          ></span>
          <span>Edit color</span><span class="opacity">${this.coordinates[3]}%</span>
        </button>
        ${
          this.expanded
            ? html` <fieldset id="channels">
                <legend>${this.label} OKLCH</legend>
                ${channels.map((channel, index) => this.renderChannel(channel, index))}
              </fieldset>`
            : nothing
        }
      </div>
    `;
  }
}
customElements.define("color-picker", ColorPicker);
