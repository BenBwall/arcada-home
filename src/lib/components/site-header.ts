import { asset } from "$site/paths.js";
import { html } from "@lit-labs/ssr/lib/server-template.js";
import { ifDefined } from "lit/directives/if-defined.js";

const links = [
  { href: "/", label: "Home" },
  { href: "/resume/", label: "Resume" },
  { href: "/projects/", label: "Projects" },
];

export const siteHeader = (route: string) => html`
  <header class="site-header">
    <nav aria-label="Primary navigation">
      ${links.map(
        (link) => html`
          <a
            href=${asset(link.href)}
            aria-current=${ifDefined(route === link.href ? "page" : undefined)}
            >${link.label}</a
          >
        `,
      )}
    </nav>
    <appearance-panel></appearance-panel>
  </header>
`;
