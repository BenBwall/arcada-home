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
