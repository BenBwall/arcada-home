<script lang="ts">
  import Lead from "$components/Lead.svelte";
  import PageTitle from "$components/PageTitle.svelte";
  import Prose from "$components/Prose.svelte";
</script>

<svelte:head>
  <title>Resume | Ben Bergenwall</title>
</svelte:head>

<div class="resume">
  <header>
    <PageTitle>Ben Bergenwall</PageTitle>
    <Lead>Software Developer<span>, Espoo, Finland</span></Lead>
    <ul aria-label="Contact details">
      <li><a href="https://github.com/BenBwall">GitHub</a></li>
    </ul>
  </header>

  <section aria-labelledby="profile-title">
    <h2 id="profile-title">Profile</h2>
    <Prose>
      <p>
        I've been coding since 2019 and enjoy turning ideas into practical tools. I've built a
        complete web application for a small business, as well as larger personal projects in Rust,
        Java and Python.
      </p>
      <p>
        After completing 130 ECTS in Computer Science, I'm continuing my studies toward a Bachelor
        of Engineering in Information Technology at Arcada.
      </p>
    </Prose>
  </section>

  <section aria-labelledby="experience-title">
    <h2 id="experience-title">Experience</h2>
    <div>
      <article>
        <div>
          <h3>Prevalabs</h3>
          <p>September 2026 - Present</p>
        </div>
        <p class="resume-role">Junior Software Developer</p>
        <p class="resume-description">
          Continuing development of a web app originally built by another student during an
          internship. The app uses a React frontend and a Python backend built with FastAPI,
          enabling doctors in Finland to use Prevalabs' own AI-driven diagnostic algorithm to
          support patient diagnosis.
        </p>
      </article>
      <article>
        <div>
          <h3>Viherkeskinen</h3>
          <p>January 2026 - Present</p>
        </div>
        <p class="resume-role">Freelance Software Developer</p>
        <ul>
          <li>
            Built a multilingual, mobile-friendly time-tracking app for a landscaping company, with
            an admin panel for reviewing reports and managing the system.
          </li>
          <li>
            Added passwordless login, user permissions, customizable reports, and synchronization
            with Google Sheets and Microsoft Excel.
          </li>
          <li>
            Developed the app with Next.js, TypeScript, tRPC, Prisma and PostgreSQL, under the
            technical supervision of Andreas Bergenwall.
          </li>
        </ul>
      </article>
      <article>
        <div>
          <h3>Helppy</h3>
          <p>October - December 2021</p>
        </div>
        <p class="resume-role">Junior Frontend Engineer</p>
        <p class="resume-description">
          Built customer-facing website features and a pricing calculator for a Finnish eldercare
          startup using TypeScript and Next.js during a ten-week fixed-term role.
        </p>
      </article>
      <article>
        <div>
          <h3>Folkhälsan</h3>
          <p>Spring 2021</p>
        </div>
        <p class="resume-role">Substitute After-School Club Instructor</p>
        <p class="resume-description">
          Supervised children across several after-school clubs, assisted with homework, and
          received positive feedback for a strong work ethic.
        </p>
      </article>
    </div>
  </section>

  <section aria-labelledby="projects-title">
    <h2 id="projects-title">Selected side projects</h2>
    <div>
      <article>
        <div>
          <h3>Voice Channel Manager</h3>
          <p>Rust, PostgreSQL</p>
        </div>
        <p class="resume-description">
          A Discord bot that lets users create and manage temporary voice channels. Settings and
          channel information are saved in a PostgreSQL database.
        </p>
      </article>
      <article>
        <div>
          <h3>CountKeeper</h3>
          <p>Python</p>
        </div>
        <p class="resume-description">
          A Discord bot that automatically shows how many server members have selected roles. Server
          administrators can choose which roles to track.
        </p>
      </article>
      <article>
        <div>
          <h3>Operator Updater</h3>
          <p>Java</p>
        </div>
        <p class="resume-description">
          A Minecraft server plugin that links a player's Discord and Minecraft accounts, using
          their Discord role to give them the correct permissions in Minecraft.
        </p>
      </article>
    </div>
  </section>

  <section aria-labelledby="education-title">
    <h2 id="education-title">Education</h2>
    <div>
      <article>
        <div>
          <h3>Arcada University of Applied Sciences</h3>
          <p>Autumn 2026 - Target 2028</p>
        </div>
        <p class="resume-role">Bachelor of Engineering in Information Technology</p>
        <p class="resume-description">Helsinki, Ingenjör (YH), informationsteknik</p>
      </article>
      <article>
        <div>
          <h3>Åbo Akademi University</h3>
          <p>2021 - 2025</p>
        </div>
        <p class="resume-role">Bachelor's studies in Computer Science (datavetenskap)</p>
        <p class="resume-description">Turku, 130 ECTS credits completed</p>
      </article>
      <article>
        <div>
          <h3>Mattlidens gymnasium</h3>
          <p>2018 - 2021</p>
        </div>
        <p class="resume-role">Finnish Matriculation Examination (studentexamen)</p>
        <p class="resume-description">Espoo, Completed spring 2021</p>
        <p class="resume-description">
          Completed a University of Helsinki Java programming MOOC through an elective IT course.
        </p>
      </article>
    </div>
  </section>

  <section aria-labelledby="skills-title">
    <h2 id="skills-title">Technical skills</h2>
    <dl>
      <div>
        <dt>Programming languages</dt>
        <dd>TypeScript, JavaScript, Rust, Java, Python, C#, C, F#, Kotlin, Scala</dd>
      </div>
      <div>
        <dt>Web and data</dt>
        <dd>Next.js, React, tRPC, Tailwind CSS, PostgreSQL, Prisma</dd>
      </div>
      <div>
        <dt>Testing and delivery</dt>
        <dd>Playwright, unit testing, GitHub Actions, Vercel, PWA development</dd>
      </div>
    </dl>
  </section>
</div>

<style>
  .resume {
    max-width: 68rem;
    margin-inline: auto;
    padding-block: clamp(1rem, 4vw, 3rem);
  }
  header {
    padding-bottom: 2.5rem;
  }
  header :global(h1) {
    margin: 0.5rem 0 1rem;
  }
  header ul,
  article div p {
    font-size: 0.875rem;
    line-height: 1.6;
  }
  span,
  article div p,
  .resume-description,
  article ul {
    color: var(--color-muted);
  }
  .resume-description,
  article ul,
  dl {
    font-size: 1rem;
    line-height: 1.75;
  }
  header ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    padding: 0;
    margin: 1.25rem 0 0;
    list-style: none;
  }
  a {
    text-underline-offset: 0.25em;
    overflow-wrap: anywhere;
  }
  a:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
    border-radius: 2px;
  }
  section {
    display: grid;
    grid-template-columns: 11rem minmax(0, 1fr);
    gap: 2rem;
    padding-block: 2rem;
    border-top: 1px solid var(--color-border);
  }
  h2 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.65;
  }
  section > div {
    display: grid;
    gap: 2rem;
    min-width: 0;
  }
  article > div {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.25rem 1rem;
  }
  h3 {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 600;
    line-height: 1.5;
  }
  article p {
    margin: 0.5rem 0 0;
  }
  article > div p {
    margin: 0;
  }
  .resume-role {
    font-size: 0.9375rem;
    line-height: 1.6;
  }
  article ul {
    padding-left: 1.25rem;
    margin: 0.75rem 0 0;
  }
  article ul li + li {
    margin-top: 0.5rem;
  }
  dl {
    display: grid;
    gap: 1rem;
    margin: 0;
  }
  dt {
    font-weight: 500;
  }
  dd {
    margin: 0.25rem 0 0;
    color: var(--color-muted);
  }
  @media (max-width: 52rem) {
    section {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }
  @media print {
    :global(:root:has(.resume)),
    :global(:root[data-theme]:has(.resume)) {
      color-scheme: light;
      --color-text: #000 !important;
      --color-primary: #000 !important;
      --color-accent: #000 !important;
      --color-muted: #444 !important;
      --color-background: #fff !important;
      --color-surface: #fff !important;
      --color-border: #ccc !important;
    }
    .resume {
      max-width: none;
      padding: 0;
    }
    section {
      grid-template-columns: 9rem minmax(0, 1fr);
      gap: 1rem;
      padding-block: 1rem;
    }
    article {
      break-inside: avoid;
    }
    header {
      padding-bottom: 1rem;
    }
    header :global(h1) {
      font-size: 2rem;
    }
  }
</style>
