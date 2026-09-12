<script lang="ts">
  import {
    type Appearance,
    type CustomTheme,
    MAX_IMPORT_BYTES,
    MAX_THEMES,
    STORAGE_KEY,
    isTheme,
  } from "$lib/theme/theme-schema";
  import {
    applyAppearance,
    getSystemTheme,
    importThemes,
    readAppearance,
    saveAppearance,
  } from "$lib/theme/theme";
  import { onMount, tick } from "svelte";
  import Button from "./Button.svelte";
  import Select from "./Select.svelte";
  import SunMoon from "@lucide/svelte/icons/sun-moon";
  import ThemeEditor from "./ThemeEditor.svelte";
  import X from "@lucide/svelte/icons/x";
  import { on } from "svelte/events";

  let appearance = $state<Appearance>({
    active: "system",
    themes: [],
    version: 1,
  });
  let ready = $state(false);
  let dialog: HTMLDialogElement;
  let trigger: HTMLButtonElement;
  let fileInput: HTMLInputElement;
  let draft = $state<CustomTheme | null>(null);
  let message = $state("");
  let error = $state("");
  let importing = $state(false);

  const selected = $derived(appearance.themes.find((theme) => theme.id === appearance.active));
  const persist = (next: Appearance, success = ""): boolean => {
    if (JSON.stringify(next).length > MAX_IMPORT_BYTES) {
      error = "Saved themes exceed 64 KB. Shorten a color value or delete a theme.";
      return false;
    }
    appearance = next;
    applyAppearance(next);
    message = saveAppearance(next)
      ? success
      : "Applied for this visit. Browser storage is unavailable; export your themes to keep them.";
    error = "";
    return true;
  };
  const focusSelection = () => {
    void tick().then(() => {
      if (dialog.open) {
        document.getElementById("theme-selection")?.focus();
      }
    });
  };
  const cancelEdit = () => {
    draft = null;
    applyAppearance(appearance);
    focusSelection();
  };
  const trapFocus = (event: KeyboardEvent) => {
    if (event.key !== "Tab") {
      return;
    }
    const controls = dialog.querySelectorAll<HTMLElement>(
      "button:not(:disabled), input:not([hidden]), select",
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  const close = () => {
    cancelEdit();
    dialog.close();

    trigger.focus();
  };
  const open = () => {
    message = "";
    error = "";
    dialog.showModal();
  };
  const customize = (edit = false) => {
    const copyNameLength = 30;
    if (!edit && appearance.themes.length >= MAX_THEMES) {
      error = `You can save up to ${MAX_THEMES} themes. Delete one before adding another.`;
      return;
    }
    draft =
      edit && selected
        ? { ...selected, colors: { ...selected.colors } }
        : {
            base:
              selected?.base ?? (isTheme(appearance.active) ? appearance.active : getSystemTheme()),
            colors: { ...selected?.colors },
            id: `custom-${crypto.randomUUID()}`,
            name: selected ? `${selected.name.slice(0, copyNameLength)} copy` : "My theme",
          };
    error = "";
    message = "";
  };
  const save = (theme: CustomTheme) => {
    const themes = appearance.themes.filter((saved) => saved.id !== theme.id);
    const saved = persist(
      { active: theme.id, themes: [...themes, theme], version: 1 },
      "Theme saved.",
    );
    if (saved) {
      draft = null;
      focusSelection();
    }
  };
  const remove = () => {
    const themes = appearance.themes.filter((theme) => theme.id !== appearance.active);
    persist({ active: selected?.base ?? "system", themes, version: 1 }, "Theme deleted.");
    focusSelection();
  };
  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ themes: appearance.themes, version: 1 }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "arcada-themes.json";
    link.click();
    const revokeDelay = 1000;
    window.setTimeout(() => URL.revokeObjectURL(url), revokeDelay);
  };
  const importFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    importing = true;
    error = "";
    message = "";
    try {
      if (file.size > MAX_IMPORT_BYTES) {
        throw new Error("Choose a theme file smaller than 64 KB.");
      }
      const themes = importThemes(await file.text());
      if (appearance.themes.length + themes.length > MAX_THEMES) {
        throw new Error(`You can save up to ${MAX_THEMES} themes. Delete some before importing.`);
      }
      persist(
        { ...appearance, themes: [...appearance.themes, ...themes] },
        "Themes imported. Choose one to try it.",
      );
    } catch (cause) {
      error =
        cause instanceof SyntaxError
          ? "This file is not valid JSON."
          : cause instanceof Error
            ? cause.message
            : "The theme file could not be read.";
    } finally {
      importing = false;
      fileInput.value = "";
    }
  };
  onMount(() => {
    appearance = readAppearance();
    ready = true;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (appearance.active === "system" && !draft) {
        applyAppearance(appearance);
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === "theme" || event.key === null) {
        appearance = readAppearance();
        draft = null;
        applyAppearance(appearance);
        message = "Appearance updated from another tab.";
      }
    };
    const mediaUnsub = on(media, "change", onSystemChange);
    const windowUnsub = on(window, "storage", onStorage);

    return () => {
      mediaUnsub();
      windowUnsub();
    };
  });
</script>

<button
  bind:this={trigger}
  id="dark-mode-toggle"
  type="button"
  aria-label="Appearance"
  aria-haspopup="dialog"
  title="Appearance"
  disabled={!ready}
  onclick={open}
>
  <SunMoon size="100%" strokeWidth={1.5} aria-hidden="true" />
</button>

<dialog
  onkeydown={trapFocus}
  bind:this={dialog}
  aria-labelledby="appearance-heading"
  oncancel={(event) => {
    event.preventDefault();
    close();
  }}
>
  <header>
    <h2 id="appearance-heading">
      {draft ? "Customize theme" : "Appearance"}
    </h2>
    <button type="button" aria-label="Close appearance" title="Close appearance" onclick={close}>
      <X size={20} aria-hidden="true" />
    </button>
  </header>
  {#if draft}
    <ThemeEditor initial={draft} onsave={save} oncancel={cancelEdit} />
  {:else}
    <label
      >Theme
      <Select
        value={appearance.active}
        onchange={(event) =>
          persist({
            ...appearance,
            active: event.currentTarget.value,
          })}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        {#each appearance.themes as theme (theme.id)}<option value={theme.id}>{theme.name}</option
          >{/each}
      </Select></label
    >

    <p>System follows your device’s appearance. Custom themes are saved in this browser.</p>
    <div class="actions">
      {#if selected}
        <Button variant="primary" onclick={() => customize(true)}>Edit</Button>
        <Button onclick={() => customize()}>Duplicate</Button>
        <Button onclick={remove}>Delete</Button>
      {:else}
        <Button variant="primary" onclick={() => customize()}>Customize</Button>
      {/if}
    </div>
    <footer>
      <h3>Theme files</h3>
      <p>Import a theme file or export your saved themes.</p>
      <div class="actions">
        <Button disabled={importing} onclick={() => fileInput.click()}>
          {importing ? "Importing…" : "Import themes"}
        </Button>
        <Button disabled={!appearance.themes.length} onclick={exportAll}>Export themes</Button>
      </div>
    </footer>
  {/if}
  <input
    bind:this={fileInput}
    type="file"
    accept=".json,application/json"
    hidden
    onchange={(event) => {
      void importFile(event.currentTarget.files?.[0]);
    }}
  />
  <p role="status">{message}</p>
  {#if error}<p role="alert">{error}</p>{/if}
</dialog>

<style>
  button[aria-haspopup="dialog"] {
    flex: 0 0 auto;
    width: 2.5rem;
    height: 2.5rem;
    margin-left: auto;
    padding: 0.5rem;
    color: var(--color-text);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.625rem;
    cursor: pointer;
  }
  button[aria-haspopup="dialog"]:hover {
    background-color: var(--color-hover);
    border-color: var(--color-border-strong);
  }
  button:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  dialog {
    color-scheme: inherit;
    box-sizing: border-box;
    width: min(28rem, calc(100vw - 2rem));
    max-height: calc(100dvh - 2rem);
    padding: 1.25rem;
    border: 1px solid var(--color-border);
    border-radius: 0.875rem;
    box-shadow: 0 1rem 3rem var(--color-shadow);
    background-color: var(--color-surface);
    color: var(--color-text);
  }
  dialog::backdrop {
    background-color: var(--color-shadow);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }
  h2 {
    margin: 0;
    font-size: 1.125rem;
  }
  header button {
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    color: var(--color-muted);
    background-color: transparent;
    border: 0;
    border-radius: 0.5rem;
    cursor: pointer;
  }
  header button:hover {
    color: var(--color-text);
    background-color: var(--color-hover);
  }
  button:active {
    background-color: var(--color-active);
  }
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
  }
  p:not([role]),
  p[role="status"] {
    color: var(--color-muted);
    font-size: 0.875rem;
    line-height: 1.5;
  }
  p[role="status"]:empty {
    display: none;
  }
  p:not([role]) {
    margin: 0.75rem 0 1.25rem;
  }
  .actions {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    gap: 0.625rem;
  }
  footer {
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--color-border);
  }
  h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
  }
  footer p {
    margin-top: 0.375rem;
  }
  @media print {
    dialog,
    dialog::backdrop {
      display: none !important;
    }
  }
</style>
