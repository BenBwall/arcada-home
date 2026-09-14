import { html } from "@lit-labs/ssr/lib/server-template.js";

export const resumePage = () => html`
  <div class="resume">
    <header>
      <h1 class="page-title">Ben Bergenwall</h1>
      <p class="lead">Software Developer<span>, Espoo, Finland</span></p>
      <ul aria-label="Contact details">
        <li><a href="https://github.com/BenBwall">GitHub</a></li>
      </ul>
    </header>

    <section aria-labelledby="profile-title">
      <h2 id="profile-title">Profile</h2>
      <div class="prose">
        <p>
          I've been coding since 2019 and enjoy turning ideas into practical tools. I've built a
          complete web application for a small business, as well as larger personal projects in
          Rust, Java and Python.
        </p>
        <p>
          After completing 130 ECTS in Computer Science, I'm continuing my studies toward a Bachelor
          of Engineering in Information Technology at Arcada.
        </p>
      </div>
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
              Built a multilingual, mobile-friendly time-tracking app for a landscaping company,
              with an admin panel for reviewing reports and managing the system.
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
            A Discord bot that automatically shows how many server members have selected roles.
            Server administrators can choose which roles to track.
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
`;
