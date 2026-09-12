<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<div>{@render children()}</div>

<style>
  div {
    color: var(--color-muted);
    font-size: 1rem;
    line-height: 1.75;
  }
  div > :global(*) {
    margin-block: 0;
  }
  div > :global(* + *) {
    margin-block-start: 1rem;
  }
</style>
