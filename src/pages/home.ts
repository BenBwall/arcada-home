import { asset } from "$site/paths.js";
import { html } from "@lit-labs/ssr/lib/server-template.js";

export const homePage = () => html`
  <section class="home-page" aria-labelledby="about-title">
    <div class="about-copy">
      <h1 class="page-title" id="about-title">About me</h1>
      <div class="prose">
        <p class="lead">
          Hi, I'm Ben, a web developer and Information Technology student at Arcada University of
          Applied Sciences.
        </p>
        <p>
          I've been programming for about seven years. Alongside my work in web development, I like
          to work on a wide array of side-projects in my freetime.
        </p>
      </div>
    </div>
    <div class="about-gallery" role="group" aria-label="Photos of me">
      <figure>
        <img
          src="${asset("/sitting-outdoors-by-the-sea.JPEG")}"
          alt="Me sitting outdoors by the sea"
          width="1200"
          height="1600"
        />
      </figure>
      <figure>
        <img
          src="${asset("/standing-on-a-cliff-on-the-beach.JPEG")}"
          alt="Me standing on a cliff on the beach"
          width="1200"
          height="1600"
          loading="lazy"
        />
      </figure>
    </div>
  </section>
`;
