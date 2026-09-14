import type { Project } from "$data/projects.js";
import { html } from "@lit-labs/ssr/lib/server-template.js";

export const projectRow = (project: Project) => html`
  <article class="project-row">
    <header>
      <p class="project-kind">${project.kind}</p>
      <h2>${project.title}</h2>
      <a href="${project.href}" aria-label="View ${project.title} on GitHub">
        View on GitHub <span aria-hidden="true">↗</span>
      </a>
    </header>
    <div class="project-details">
      <p class="project-description">${project.description}</p>
      <ul aria-label="Technologies" role="list">
        ${project.technologies.map((technology) => html`<li>${technology}</li>`)}
      </ul>
    </div>
  </article>
`;
