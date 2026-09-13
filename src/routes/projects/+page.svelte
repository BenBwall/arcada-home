<script lang="ts">
  import Lead from "$lib/components/Lead.svelte";
  import PageTitle from "$lib/components/PageTitle.svelte";
  import ProjectRow from "$lib/components/ProjectRow.svelte";
  import { projects } from "$lib/data/projects";
</script>

<svelte:head>
  <title>Projects | Ben Bergenwall</title>
</svelte:head>

<div class="projects-page">
  <header>
    <PageTitle>Projects</PageTitle>
    <div>
      <Lead
        >A selection of my side projects, from Discord bots and browser games to programming
        languages and virtual machines.</Lead
      >
    </div>
    <a href="https://github.com/BenBwall">More on GitHub <span aria-hidden="true">↗</span></a>
  </header>
  <section aria-label="Selected projects">
    {#each projects as project (project.href)}
      <ProjectRow {project} />
    {/each}
  </section>
</div>

<style>
  .projects-page {
    max-width: 68rem;
    margin-inline: auto;
    padding-block: clamp(1rem, 4vw, 3rem);
  }
  header {
    margin-bottom: 2.5rem;
  }
  header div {
    max-width: 52ch;
    margin: 0 0 1rem;
  }
  a {
    text-underline-offset: 0.25em;
    font-size: 0.875rem;
    line-height: 1.6;
  }
  a:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
    border-radius: 2px;
  }
  section {
    border-bottom: 1px solid var(--color-border);
  }
</style>
