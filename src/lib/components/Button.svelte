<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  let {
    children,
    variant = "secondary",
    type = "button",
    ...attributes
  }: HTMLButtonAttributes & {
    children: Snippet;
    variant?: "primary" | "secondary" | "quiet";
  } = $props();
</script>

<button {...attributes} {type} data-variant={variant}>{@render children()}</button>

<style>
  button {
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

  button:enabled:hover {
    background-color: color-mix(in srgb, var(--color-text) 12%, var(--color-surface));
  }

  button:enabled:active {
    background-color: var(--color-active);
  }

  button[data-variant="primary"] {
    color: var(--color-surface);
    background-color: var(--color-text);
    border-color: var(--color-text);
  }

  button[data-variant="primary"]:enabled:hover {
    background-color: color-mix(in srgb, var(--color-text) 85%, var(--color-surface));
  }

  button[data-variant="quiet"] {
    color: var(--color-muted);
    background-color: transparent;
    border-color: transparent;
  }

  button[data-variant="quiet"]:enabled:hover {
    color: var(--color-text);
    background-color: var(--color-hover);
  }

  button:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
