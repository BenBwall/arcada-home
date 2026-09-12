export type Project = {
  title: string;
  kind: string;
  description: string;
  technologies: string[];
  href: string;
};
export const projects: Project[] = [
  {
    description:
      "I built a Discord bot that creates a voice channel when someone joins a template channel, then removes it when it becomes empty. Channel names and capacity can be configured, with settings stored in PostgreSQL.",
    href: "https://github.com/BenBwall/voice-channel-manager",
    kind: "Discord automation",
    technologies: ["Rust", "Serenity", "PostgreSQL"] as const,
    title: "Voice Channel Manager",
  },
  {
    description:
      "A virtual machine and assembler inspired by the game Turing Complete. I built a Rust assembler and runtime, plus a browser editor where programs can be assembled, inspected as bytecode, and stepped through one instruction at a time.",
    href: "https://github.com/BenBwall/Myvm",
    kind: "Virtual machine & assembler",
    technologies: ["Rust", "TypeScript", "WebAssembly"] as const,
    title: "Myvm",
  },
  {
    description:
      "An experimental card-game interface with a shuffled deck, animated card drawing, and a curved hand that responds to hovering. I used SolidJS to manage the cards and their positions as the hand changes.",
    href: "https://github.com/BenBwall/cardgame",
    kind: "Frontend experiment",
    technologies: ["TypeScript", "SolidJS", "Tailwind CSS"] as const,
    title: "Card game interface",
  },
  {
    description:
      "A Discord bot that displays member counts in voice-channel names. Server administrators can choose which roles to track and configure counting channels through bot commands.",
    href: "https://github.com/BenBwall/CountKeeper",
    kind: "Discord automation",
    technologies: ["Python", "Discord"] as const,
    title: "CountKeeper",
  },
  {
    description:
      "An experimental programming language implemented in Rust. The project includes a lexer, parser, bytecode generator, and runtime, with command-line tools for inspecting and running programs.",
    href: "https://github.com/BenBwall/Anaconda",
    kind: "Programming language experiment",
    technologies: ["Rust", "Parsing", "Bytecode"] as const,
    title: "Anaconda",
  },
  {
    description:
      "A Sudoku web app with a custom board generator. It fills a grid using randomized backtracking, then removes numbers to create a puzzle with a chosen number of starting clues.",
    href: "https://github.com/BenBwall/sudoku",
    kind: "Browser puzzle",
    technologies: ["TypeScript", "Next.js", "React"] as const,
    title: "Sudoku",
  },
];
