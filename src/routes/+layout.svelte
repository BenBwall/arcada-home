<script lang="ts">
  import "$theme/themes.css";

  import type { LayoutProps } from "$route-types/$types";
  import SiteHeader from "$components/SiteHeader.svelte";
  let { children }: LayoutProps = $props();
</script>

<SiteHeader />
<main>
  {@render children()}
</main>

<style>
  :global {
    :root[data-theme="dark"] {
      color-scheme: dark;
      --color-background: oklch(0.2 0 0);
      --color-surface: oklch(0.22 0 0);
      --color-text: oklch(1 0 0);
      --color-muted: oklch(0.8 0 0);
      --color-primary: oklch(0.7 0.2 290);
      --color-secondary: oklch(0.8 0.15 185);
      --color-accent: oklch(0.7 0.2 5);
      --color-border: oklch(0.3 0 0);
      --color-border-strong: oklch(0.5 0 0);
      --color-hover: oklch(0.2 0 0);
      --color-active: oklch(0.2 0 0);
      --color-shadow: oklch(0 0 0 / 0.25);
      --nav-active-background: oklch(0.9 0 0);
      --nav-active-text: oklch(0.2 0 0);
    }

    :root[data-theme="light"] {
      color-scheme: light;
      --color-background: oklch(1 0 0);
      --color-surface: oklch(1 0 0);
      --color-text: oklch(0 0 0);
      --color-muted: oklch(0.5 0.01 255);
      --color-primary: oklch(0.5 0.3 285);
      --color-secondary: oklch(0.4 0.08 185);
      --color-accent: #9b4562;
      --color-border: oklch(0.85 0 0);
      --color-border-strong: oklch(0.7 0 0);
      --color-hover: oklch(0.95 0.001 285);
      --color-active: oklch(0.95 0.02 300);
      --color-shadow: oklch(0 0 0 / 0.08);
      --nav-active-background: oklch(0.2 0.01 285);
      --nav-active-text: oklch(1 0 0);
    }

    body {
      margin: 0;
      color: var(--color-text);
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      background-color: var(--color-background);
    }

    /* Shared colors for browser-rendered page details. */
    :root {
      accent-color: var(--color-accent);
      scrollbar-color: var(--color-border-strong) var(--color-surface);
    }

    ::selection {
      color: var(--color-surface);
      background-color: var(--color-primary);
    }

    a,
    a:visited {
      color: var(--color-primary);
    }
    a:hover {
      color: var(--color-accent);
    }
    :focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }
  }

  main {
    padding: 2rem clamp(1rem, 4vw, 4rem);
  }

  @media print {
    main:has(:global(.resume)) {
      padding: 0;
    }
  }
</style>
