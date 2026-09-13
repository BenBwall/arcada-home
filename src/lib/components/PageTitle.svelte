<script lang="ts">
  import type { Snippet } from "svelte";

  let { children, id }: { children: Snippet; id?: string } = $props();
</script>

<h1 {id}>{@render children()}</h1>

<style>
  h1 {
    margin: 0 0 1.5rem;
    font-size: clamp(2.25rem, 6vw, 4rem);
    font-weight: 700;
    letter-spacing: -0.045em;
    line-height: 1.05;
    text-wrap: balance;
  }
</style>
