import { asset } from "$site/paths.js";
import { css } from "lit";
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

export const homeStyles = css`
  .home-page {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    align-items: center;
    gap: clamp(2rem, 4vw, 4rem);
    max-width: 68rem;
    margin-inline: auto;
    padding-block: clamp(1rem, 4vw, 3rem);
  }

  .home-page div {
    min-width: 0;
  }

  .home-page .about-gallery {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    justify-self: stretch;
    width: 100%;
    gap: 0.75rem;
  }

  .home-page figure {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
  }

  .home-page figure:first-child {
    margin-top: 0;
  }

  .home-page img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 4;
    object-fit: cover;
  }

  @media (max-width: 52rem) {
    .home-page {
      grid-template-columns: 1fr;
    }

    .home-page .about-gallery {
      justify-self: start;
      max-width: 32rem;
    }
  }

  .home-page .about-copy {
    max-width: 52ch;
  }
`;
