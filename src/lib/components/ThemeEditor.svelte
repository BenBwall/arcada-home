<script lang="ts">
  import {
    type Colors,
    type CustomTheme,
    MAX_NAME_LENGTH,
    colorFields,
    isCssColor,
    isTheme,
  } from "$lib/theme/theme-schema";

  import { onMount, tick } from "svelte";
  import Button from "./Button.svelte";
  import ColorPicker from "./ColorPicker.svelte";
  import Select from "./Select.svelte";
  import { applyTheme } from "$lib/theme/theme";
  import { readCurrentColors } from "$lib/theme/color-utils";

  let {
    initial,
    onsave,
    oncancel,
  }: {
    initial: CustomTheme;
    onsave: (theme: CustomTheme) => void;
    oncancel: () => void;
  } = $props();
  let draft = $state<CustomTheme>({
    base: "light",
    colors: {},
    id: "",
    name: "",
  });
  let resolved = $state<Partial<Colors> | null>(null);
  let entered = $state<Partial<Colors>>({});
  let errors = $state<Partial<Colors>>({});
  const hasErrors = $derived(Object.values(errors).some(Boolean));
  const preview = () => {
    applyTheme(draft.base, draft.colors);
    resolved = readCurrentColors();
  };
  onMount(() => {
    draft = { ...initial, colors: { ...initial.colors } };
    entered = { ...initial.colors };
    void tick().then(() => document.getElementById("theme-name")?.focus());
    preview();
  });
  const changeColor = (key: keyof Colors, value: string) => {
    entered[key] = value;
    if (!isCssColor(value)) {
      errors[key] = "Enter a CSS color supported by this browser.";
      return;
    }
    errors[key] = "";
    draft.colors = { ...draft.colors, [key]: value.trim() };
    preview();
  };
  const reset = () => {
    draft.colors = {};
    entered = {};
    errors = {};
    preview();
  };
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onsave({ ...draft, name: draft.name.trim() });
  }}
>
  <p>Preview changes across the page. Save to keep them.</p>
  <label
    >Theme name
    <input bind:value={draft.name} maxlength={MAX_NAME_LENGTH} required autocomplete="off" /></label
  >

  <label
    >Base appearance
    <Select
      value={draft.base}
      options={[
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
      ]}
      onchange={(event) => {
        if (isTheme(event.currentTarget.value)) {
          draft.base = event.currentTarget.value;
          preview();
        }
      }}
    /></label
  >

  <p>
    Adjust lightness, chroma, hue, and opacity in OKLCH, or enter any CSS color your browser
    supports.
  </p>
  {#if resolved}
    <div class="colors">
      {#each colorFields as field (field.key)}
        <div>
          <label for={`theme-${field.key}-color`}>{field.label}</label>
          <ColorPicker
            label={field.label}
            value={resolved[field.key] ?? "oklch(0 0 0)"}
            onchange={(value) => changeColor(field.key, value)}
          />

          <input
            id={`theme-${field.key}-color`}
            aria-label={`${field.label} CSS color`}
            value={entered[field.key] ?? resolved[field.key]}
            aria-invalid={!!errors[field.key]}
            aria-describedby={errors[field.key] ? `theme-${field.key}-error` : undefined}
            required
            spellcheck="false"
            oninput={(event) => changeColor(field.key, event.currentTarget.value)}
          />
          {#if errors[field.key]}
            <p id={`theme-${field.key}-error`} role="alert">
              {errors[field.key]}
            </p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <div class="form-actions">
    <div>
      <Button onclick={oncancel}>Cancel</Button>
      <Button type="submit" variant="primary" disabled={!draft.name.trim() || hasErrors}
        >Save theme</Button
      >
    </div>
    <Button variant="quiet" onclick={reset}>Reset colors</Button>
  </div>
</form>

<style>
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
</style>
