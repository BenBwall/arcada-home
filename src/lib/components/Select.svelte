<script lang="ts">
  import type { HTMLSelectAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  let {
    children,
    value = $bindable(),
    ...attributes
  }: HTMLSelectAttributes & { children: Snippet } = $props();
</script>

<span>
  <select {...attributes} bind:value>{@render children()}</select>
</span>

<style>
  span {
    display: block;
    position: relative;
    margin-top: 0.5rem;
  }

  span::after {
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
    transition: rotate 300ms ease;
    pointer-events: none;
  }

  span:has(select:open)::after {
    rotate: 180deg;
  }

  @media (prefers-reduced-motion: reduce) {
    span::after {
      transition: none;
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

  select :global(option) {
    color: var(--color-text);
    background-color: var(--color-surface);
  }
</style>
