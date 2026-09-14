import { css } from "lit";
import { html } from "@lit-labs/ssr/lib/server-template.js";
import { projectRow } from "$components/project-row.js";
import { projects } from "$data/projects.js";

export const projectsPage = () => html`
  <div class="projects-page">
    <header>
      <h1 class="page-title">Projects</h1>
      <div>
        <p class="lead">
          A selection of my side projects, from Discord bots and browser games to programming
          languages and virtual machines.
        </p>
      </div>
      <a href="https://github.com/BenBwall">More on GitHub <span aria-hidden="true">↗</span></a>
    </header>
    <section aria-label="Selected projects">${projects.map(projectRow)}</section>
  </div>
`;

export const projectsStyles = css`
  .projects-page {
    max-width: 68rem;
    margin-inline: auto;
    padding-block: clamp(1rem, 4vw, 3rem);
  }
  .projects-page > header {
    margin-bottom: 2.5rem;
  }
  .projects-page > header div {
    max-width: 52ch;
    margin: 0 0 1rem;
  }
  .projects-page > header a {
    text-underline-offset: 0.25em;
    font-size: 0.875rem;
    line-height: 1.6;
  }
  .projects-page > header a:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
    border-radius: 2px;
  }
  .projects-page > section {
    border-bottom: 1px solid var(--color-border);
  }
`;
