<script lang="ts">
  import type { Project } from "$data/projects";
  let { project }: { project: Project } = $props();
</script>

<article>
  <header>
    <p class="project-kind">{project.kind}</p>
    <h2>{project.title}</h2>
    <a href={project.href} aria-label={`View ${project.title} on GitHub`}>
      View on GitHub <span aria-hidden="true">↗</span>
    </a>
  </header>
  <div class="project-details">
    <p class="project-description">{project.description}</p>
    <ul aria-label="Technologies" role="list">
      {#each project.technologies as technology (technology)}
        <li>{technology}</li>
      {/each}
    </ul>
  </div>
</article>

<style>
  article {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.7fr);
    gap: clamp(2rem, 6vw, 5rem);
    min-width: 0;
    padding-block: clamp(1.75rem, 4vw, 2.75rem);
    border-top: 1px solid var(--color-border);
  }
  header,
  .project-details {
    min-width: 0;
  }
  .project-kind,
  ul,
  a {
    font-size: 0.875rem;
    line-height: 1.6;
  }
  p {
    color: var(--color-muted);
  }
  .project-kind {
    margin: 0 0 0.5rem;
  }
  h2 {
    margin: 0;
    font-size: clamp(1.375rem, 2.5vw, 1.625rem);
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.3;
  }
  .project-description {
    max-width: 62ch;
    margin: 0 0 1rem;
    font-size: 1rem;
    line-height: 1.75;
  }
  ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 1.25rem;
    padding: 0;
    margin: 0;
    list-style: none;
  }
  li {
    color: var(--color-muted);
  }
  a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 2rem;
    margin-top: 0.75rem;
    text-underline-offset: 0.25em;
  }
  a:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
    border-radius: 2px;
  }
  @media (max-width: 44rem) {
    article {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }
</style>
