<script lang="ts">
  import ThemeToggle from "./ThemeToggle.svelte";
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  const links = [
    { href: "/", label: "Home", route: "/" },
    { href: "/resume/", label: "Resume", route: "/resume" },
    { href: "/projects/", label: "Projects", route: "/projects" },
  ] as const;
</script>

<header>
  <nav aria-label="Primary navigation">
    {#each links as link (link.route)}
      <a href={resolve(link.href)} aria-current={page.route.id === link.route ? "page" : undefined}>
        {link.label}
      </a>
    {/each}
  </nav>
  <ThemeToggle />
</header>

<style>
  header {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-height: 3.75rem;
    padding: 0.75rem clamp(1rem, 4vw, 4rem);
    overflow-x: auto;
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  nav {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  a {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.75rem;
    padding: 0.625rem 1rem;
    color: var(--color-muted);
    font-size: 0.9375rem;
    font-weight: 500;
    letter-spacing: -0.01em;
    line-height: 1;
    text-decoration: none;
    background-color: transparent;
    border-radius: 0.5rem;
    transition:
      color 120ms ease,
      background-color 120ms ease;
  }

  a:hover {
    color: var(--color-text);
    background-color: var(--color-hover);
  }

  a:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  a[aria-current="page"] {
    color: var(--nav-active-text);
    font-weight: 600;
    background-color: var(--nav-active-background);
  }

  a:active {
    background-color: var(--color-active);
  }

  @media (max-width: 24rem) {
    header {
      gap: 0.5rem;
    }
    a {
      padding-inline: 0.75rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    a {
      transition: none;
    }
  }

  @media print {
    :global(body:has(.resume)) header {
      display: none;
    }
  }
</style>
