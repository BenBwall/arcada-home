import { asset } from "$site/paths.js";
import { css } from "lit";
import { html } from "@lit-labs/ssr/lib/server-template.js";

// Source widths in physical pixels for responsive image selection.
// eslint-disable-next-line no-magic-numbers
export const photoWidths = [320, 480, 640, 960] as const;
export const homePhotos = [
  "sitting-outdoors-by-the-sea",
  "standing-on-a-cliff-on-the-beach",
] as const;
const photoSizes = "(max-width: 52rem) min(248px, calc(50vw - 24px), calc(46vw - 8px)), 240px";
const photoSources = (name: string, format: "avif" | "webp" = "webp") =>
  photoWidths
    .map((width) => `${asset(`_app/images/${name}-${width}.${format}`)} ${width}w`)
    .join(", ");

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
        <picture>
          <source
            type="image/avif"
            srcset=${photoSources(homePhotos[0], "avif")}
            sizes=${photoSizes}
          />
          <img
            src=${asset("_app/images/sitting-outdoors-by-the-sea-640.webp")}
            srcset=${photoSources(homePhotos[0])}
            sizes=${photoSizes}
            decoding="async"
            fetchpriority="high"
            alt="Me sitting outdoors by the sea"
            width="1200"
            height="1600"
          />
        </picture>
      </figure>
      <figure>
        <picture>
          <source
            type="image/avif"
            srcset=${photoSources(homePhotos[1], "avif")}
            sizes=${photoSizes}
          />
          <img
            src=${asset("_app/images/standing-on-a-cliff-on-the-beach-640.webp")}
            srcset=${photoSources(homePhotos[1])}
            sizes=${photoSizes}
            decoding="async"
            alt="Me standing on a cliff on the beach"
            width="1200"
            height="1600"
            loading="lazy"
          />
        </picture>
      </figure>
    </div>
  </section>
  <section class="card-game-section" aria-labelledby="card-game-title">
    <h2 id="card-game-title">Take a card break</h2>
    <p>Play Shithead against the computer or online, or draw and arrange cards in free play.</p>
    <div id="card-game-mount" data-multiplayer-url=${process.env.MULTIPLAYER_URL ?? ""}></div>
    <noscript>Enable JavaScript to play the card game locally in your browser.</noscript>
  </section>
`;

export const homeStyles = css`
  .card-game-section {
    max-width: 68rem;
    margin: 2rem auto;
  }

  .card-game-section > p {
    color: var(--color-muted);
    margin-bottom: 1.5rem;
  }

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
