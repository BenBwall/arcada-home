<script lang="ts">
  import { type OklchChannels, formatOklch, oklchChannels } from "$lib/theme/color-utils";

  let {
    label,
    value,
    onchange,
  }: {
    label: string;
    value: string;
    onchange: (value: string) => void;
  } = $props();
  const PERCENT_MAX = 100;
  const HUE_MAX = 360;
  const CHROMA_MAX = 0.5;
  const channels = ["Lightness", "Chroma", "Hue", "Opacity"] as const;
  const units = [" %", "", " °", " %"] as const;
  const PERCENT_STEP = 0.1;
  const CHROMA_STEP = 0.001;
  const steps = [PERCENT_STEP, CHROMA_STEP, 1, PERCENT_STEP];
  const id = $props.id();
  let expanded = $state(false);
  let editing = $state<{ index: number; value: string } | null>(null);
  const coordinates = $derived(oklchChannels(value));
  const maxima = [PERCENT_MAX, CHROMA_MAX, HUE_MAX, PERCENT_MAX];
  const gradient = (index: number) => {
    const values = index === 2 ? [0, HUE_MAX / 2, HUE_MAX] : [0, maxima[index] ?? PERCENT_MAX];
    const stops = values.map((channelValue) => {
      const next: [number, number, number, number] = [...coordinates];
      next[3] = PERCENT_MAX;
      next[index] = channelValue;
      return formatOklch(next);
    });
    const interpolation = index === 2 ? "oklch increasing hue" : "oklch";
    return `linear-gradient(to right in ${interpolation}, ${stops.join(", ")})`;
  };
  const change = (index: number, input: HTMLInputElement) => {
    if (!Number.isFinite(input.valueAsNumber)) {
      return;
    }
    const next: [number, number, number, number] = [...coordinates];
    next[index] = Math.max(0, Math.min(maxima[index] ?? PERCENT_MAX, input.valueAsNumber));
    // Update the DOM even when clamping leaves the current color unchanged.
    if (next[index] !== input.valueAsNumber) {
      input.value = String(next[index]);
    }
    onchange(formatOklch(next satisfies OklchChannels));
  };
  const previewNumber = (index: number, input: HTMLInputElement) => {
    // Keep intermediate text in the browser; only valid values affect the preview.
    if (input.validity.valid) {
      change(index, input);
    }
  };
  const commitNumber = (index: number, input: HTMLInputElement) => {
    if (!Number.isFinite(input.valueAsNumber)) {
      input.value = String(coordinates[index]);
    }
    change(index, input);
    editing = { index, value: input.value };
  };
</script>

<div class="color-picker">
  <button
    type="button"
    aria-label={`Pick ${label.toLowerCase()} color`}
    aria-expanded={expanded}
    aria-controls={`${id}-channels`}
    onclick={() => {
      expanded = !expanded;
    }}
  >
    <span class="checkerboard swatch" aria-hidden="true"
      ><span style:background={value}></span></span
    >
    <span>Edit color</span>
    <span class="opacity">{coordinates[3]}%</span>
  </button>
  {#if expanded}
    <fieldset id={`${id}-channels`}>
      <legend>{label} OKLCH</legend>
      {#each channels as channel, index (channel)}
        <div class="channel">
          <label for={`${id}-${channel.toLowerCase()}`}>{channel}{units[index]}</label>
          <div class="checkerboard track">
            <input
              type="range"
              aria-label={`${label} ${channel.toLowerCase()}`}
              min="0"
              max={maxima[index]}
              step={steps[index]}
              value={coordinates[index]}
              style:background={gradient(index)}
              oninput={(event) => change(index, event.currentTarget)}
            />
          </div>
          <input
            id={`${id}-${channel.toLowerCase()}`}
            type="number"
            aria-label={`${label} ${channel.toLowerCase()} value`}
            min="0"
            max={maxima[index]}
            onfocus={(event) => {
              // Freeze Svelte's value prop while the browser owns the editable text.
              editing = { index, value: event.currentTarget.value };
            }}
            onblur={(event) => {
              commitNumber(index, event.currentTarget);
              editing = null;
            }}
            onkeydown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitNumber(index, event.currentTarget);
              }
            }}
            step="any"
            required
            value={editing?.index === index ? editing.value : coordinates[index]}
            oninput={(event) => previewNumber(index, event.currentTarget)}
          />
        </div>
      {/each}
    </fieldset>
  {/if}
</div>

<style>
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
</style>
