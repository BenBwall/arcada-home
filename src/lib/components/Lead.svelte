<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<p>{@render children()}</p>

<style>
  p {
    margin: 0;
    color: var(--color-text);
    font-size: clamp(1.125rem, 2vw, 1.25rem);
    line-height: 1.65;
    text-wrap: pretty;
  }
</style>
