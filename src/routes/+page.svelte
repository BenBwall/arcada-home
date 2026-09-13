<script lang="ts">
  import Lead from "$lib/components/Lead.svelte";
  import PageTitle from "$lib/components/PageTitle.svelte";
  import Prose from "$lib/components/Prose.svelte";
  import { asset } from "$app/paths";
</script>

<svelte:head>
  <title>Home</title>
</svelte:head>

<section aria-labelledby="about-title">
  <div class="about-copy">
    <PageTitle id="about-title">About me</PageTitle>
    <Prose>
      <Lead
        >Hi, I'm Ben, a web developer and Information Technology student at Arcada University of
        Applied Sciences.</Lead
      >
      <p>
        I've been programming for about seven years. Alongside my work in web development, I like to
        work on a wide array of side-projects in my freetime.
      </p>
    </Prose>
  </div>
  <div class="about-gallery" role="group" aria-label="Photos of me">
    <figure>
      <img
        src={asset("/sitting-outdoors-by-the-sea.JPEG")}
        alt="Me sitting outdoors by the sea"
        width="1200"
        height="1600"
      />
    </figure>
    <figure>
      <img
        src={asset("/standing-on-a-cliff-on-the-beach.JPEG")}
        alt="Me standing on a cliff on the beach"
        width="1200"
        height="1600"
        loading="lazy"
      />
    </figure>
  </div>
</section>

<style>
  section {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    align-items: center;
    gap: clamp(2rem, 4vw, 4rem);
    max-width: 68rem;
    margin-inline: auto;
    padding-block: clamp(1rem, 4vw, 3rem);
  }

  div {
    min-width: 0;
  }

  .about-gallery {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    justify-self: stretch;
    width: 100%;
    gap: 0.75rem;
  }

  figure {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
  }

  figure:first-child {
    margin-top: 0;
  }

  img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 4;
    object-fit: cover;
  }

  @media (max-width: 52rem) {
    section {
      grid-template-columns: 1fr;
    }

    .about-gallery {
      justify-self: start;
      max-width: 32rem;
    }
  }

  .about-copy {
    max-width: 52ch;
  }
</style>
