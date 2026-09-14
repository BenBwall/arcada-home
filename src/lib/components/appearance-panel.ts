import "$components/theme-editor.js";
import {
  type Appearance,
  type CustomTheme,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_BYTES_HUMAN_READABLE,
  MAX_THEMES,
  STORAGE_KEY,
  isAppearanceMode,
} from "$theme/theme-schema.js";
import {
  DEFAULT_SCHEME,
  colorSchemes,
  getBuiltInTheme,
  getColorScheme,
} from "$theme/built-in-themes.js";
import { LitElement, html, nothing } from "lit";
import {
  applyAppearance,
  getSystemTheme,
  importThemes,
  readAppearance,
  resolveBuiltInTheme,
  saveAppearance,
} from "$theme/theme.js";
import {
  closeIcon,
  getInput,
  inputValue,
  selectOptions,
  stylesheets,
  sunMoonIcon,
} from "$components/shared-ui.js";
import { live } from "lit/directives/live.js";
import { readCurrentColors } from "$theme/color-utils.js";

export class AppearancePanel extends LitElement {
  static properties = {
    appearance: { state: true },
    draft: { state: true },
    error: { state: true },
    importing: { state: true },
    message: { state: true },
    ready: { state: true },
  };

  appearance: Appearance = { mode: "system", scheme: DEFAULT_SCHEME, themes: [], version: 2 };
  draft: CustomTheme | null = null;
  error = "";
  importing = false;
  message = "";
  ready = false;
  listeners: AbortController | null = null;

  get selected() {
    return this.appearance.themes.find((theme) => theme.id === this.appearance.scheme);
  }
  get dialog() {
    return this.shadowRoot?.querySelector("dialog");
  }
  get fileInput() {
    return this.shadowRoot?.querySelector<HTMLInputElement>('input[type="file"]');
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.hasUpdated) {
      this.listen();
    }
  }

  firstUpdated(): void {
    this.appearance = readAppearance();
    applyAppearance(this.appearance);
    this.ready = true;
    this.listen();
  }

  listen(): void {
    this.listeners?.abort();
    this.listeners = new AbortController();
    const options = { signal: this.listeners.signal };
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener(
      "change",
      () => {
        if (this.appearance.mode === "system" && !this.selected && !this.draft) {
          applyAppearance(this.appearance);
        }
      },
      options,
    );
    window.addEventListener(
      "storage",
      (event) => {
        if (event.key === STORAGE_KEY || event.key === "theme" || event.key === null) {
          this.appearance = readAppearance();
          this.draft = null;
          applyAppearance(this.appearance);
          this.message = "Appearance updated from another tab.";
        }
      },
      options,
    );
  }

  disconnectedCallback(): void {
    this.listeners?.abort();
    super.disconnectedCallback();
  }

  persist(next: Appearance, success = ""): boolean {
    if (JSON.stringify(next).length > MAX_IMPORT_BYTES) {
      this.error = `Saved themes exceed ${MAX_IMPORT_BYTES_HUMAN_READABLE}. Shorten a color value or delete a theme.`;
      return false;
    }
    this.appearance = next;
    applyAppearance(next);
    this.message = saveAppearance(next)
      ? success
      : "Applied for this visit. Browser storage is unavailable; export your themes to keep them.";
    this.error = "";
    return true;
  }

  focusSelection(): void {
    void this.updateComplete.then(() => {
      if (this.dialog?.open) {
        this.shadowRoot?.getElementById("theme-selection")?.focus();
      }
    });
  }

  cancelEdit(): void {
    this.draft = null;
    applyAppearance(this.appearance);
    this.focusSelection();
  }

  close(): void {
    this.cancelEdit();
    this.dialog?.close();
    this.shadowRoot?.getElementById("dark-mode-toggle")?.focus();
  }

  open(): void {
    this.message = "";
    this.error = "";
    this.dialog?.showModal();
  }

  customize(edit = false): void {
    const copyNameLength = 30;
    const selected = this.selected;
    const builtIn = getBuiltInTheme(resolveBuiltInTheme(this.appearance));
    if (!edit && this.appearance.themes.length >= MAX_THEMES) {
      this.error = `You can save up to ${MAX_THEMES} themes. Delete one before adding another.`;
      return;
    }
    this.draft =
      edit && selected
        ? { ...selected, colors: { ...selected.colors } }
        : {
            base: selected?.base ?? builtIn?.base ?? getSystemTheme(),
            baseScheme: selected
              ? (selected.baseScheme ?? "classic")
              : (getColorScheme(this.appearance.scheme)?.id ?? DEFAULT_SCHEME),
            colors: selected
              ? { ...selected.colors }
              : builtIn && builtIn.id !== builtIn.base
                ? readCurrentColors()
                : {},
            id: `custom-${crypto.randomUUID()}`,
            name: selected
              ? `${selected.name.slice(0, copyNameLength)} copy`
              : builtIn
                ? `${builtIn.name} copy`
                : "My theme",
          };
    this.error = "";
    this.message = "";
  }

  save(event: CustomEvent<CustomTheme>): void {
    const theme = event.detail;
    const themes = this.appearance.themes.filter((saved) => saved.id !== theme.id);
    if (
      this.persist(
        { ...this.appearance, scheme: theme.id, themes: [...themes, theme] },
        "Theme saved.",
      )
    ) {
      this.draft = null;
      this.focusSelection();
    }
  }

  removeTheme(): void {
    const themes = this.appearance.themes.filter((theme) => theme.id !== this.appearance.scheme);
    this.persist({ ...this.appearance, scheme: DEFAULT_SCHEME, themes }, "Theme deleted.");
    this.focusSelection();
  }

  exportAll(): void {
    const blob = new Blob(
      [JSON.stringify({ themes: this.appearance.themes, version: 1 }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "arcada-themes.json";
    link.click();
    const revokeDelay = 1000;
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, revokeDelay);
  }

  async importFile(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }
    this.importing = true;
    this.error = "";
    this.message = "";
    try {
      if (file.size > MAX_IMPORT_BYTES) {
        throw new Error("Choose a theme file smaller than 64 KB.");
      }
      const themes = importThemes(await file.text());
      if (this.appearance.themes.length + themes.length > MAX_THEMES) {
        throw new Error(`You can save up to ${MAX_THEMES} themes. Delete some before importing.`);
      }
      this.persist(
        { ...this.appearance, themes: [...this.appearance.themes, ...themes] },
        "Themes imported. Choose one to try it.",
      );
    } catch (cause) {
      this.error =
        cause instanceof SyntaxError
          ? "This file is not valid JSON."
          : cause instanceof Error
            ? cause.message
            : "The theme file could not be read.";
    } finally {
      this.importing = false;
      if (this.fileInput) {
        this.fileInput.value = "";
      }
    }
  }

  renderSelectors() {
    const selected = this.selected;
    return html`
      <div class="theme-selectors">
        <label for="appearance-mode"
          >Appearance
          <span class="select-control"
            ><select
              id="appearance-mode"
              aria-describedby="appearance-help"
              .value=${live(selected?.base ?? this.appearance.mode)}
              ?disabled=${!!selected}
              @change=${(event: Event) => {
                const mode = inputValue(event);
                if (isAppearanceMode(mode)) {
                  this.persist({ ...this.appearance, mode });
                }
              }}
            >
              ${selectOptions(
                [
                  { label: "System", value: "system" },
                  { label: "Light", value: "light" },
                  { label: "Dark", value: "dark" },
                ],
                selected?.base ?? this.appearance.mode,
              )}
            </select></span
          >
        </label>
        <label for="theme-selection"
          >Color scheme
          <span class="select-control"
            ><select
              id="theme-selection"
              .value=${live(this.appearance.scheme)}
              @change=${(event: Event) => this.persist({ ...this.appearance, scheme: inputValue(event) })}
            >
              ${selectOptions(
                [
                  ...colorSchemes.map((scheme) => ({ label: scheme.name, value: scheme.id })),
                  ...this.appearance.themes.map((theme) => ({
                    label: theme.name,
                    value: theme.id,
                  })),
                ],
                this.appearance.scheme,
              )}
            </select></span
          >
        </label>
      </div>
      <p id="appearance-help">
        ${selected ? "This custom theme uses its saved appearance. Edit it to change its colors." : "System follows your device’s light or dark appearance."}
      </p>
      <div class="actions">
        ${
          selected
            ? html`
                <button
                  type="button"
                  data-variant="primary"
                  @click=${() => {
                    this.customize(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  data-variant="secondary"
                  @click=${() => {
                    this.customize();
                  }}
                >
                  Duplicate
                </button>
                <button type="button" data-variant="secondary" @click=${this.removeTheme}>
                  Delete
                </button>
              `
            : html`<button
                type="button"
                data-variant="primary"
                @click=${() => {
                  this.customize();
                }}
              >
                Customize
              </button>`
        }
      </div>
      <div class="theme-files">
        <h3>Theme files</h3>
        <p>Import a theme file or export your saved themes.</p>
        <div class="actions">
          <button
            type="button"
            data-variant="secondary"
            ?disabled=${this.importing}
            @click=${() => this.fileInput?.click()}
          >
            ${this.importing ? "Importing…" : "Import themes"}
          </button>
          <button
            type="button"
            data-variant="secondary"
            ?disabled=${!this.appearance.themes.length}
            @click=${this.exportAll}
          >
            Export themes
          </button>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      ${stylesheets("controls", "appearance-panel")}
      <button
        id="dark-mode-toggle"
        type="button"
        aria-label="Appearance"
        aria-haspopup="dialog"
        title="Appearance"
        ?disabled=${!this.ready}
        @click=${this.open}
      >
        ${sunMoonIcon()}
      </button>
      <dialog
        aria-labelledby="appearance-heading"
        @cancel=${(event: Event) => {
          event.preventDefault();
          this.close();
        }}
      >
        <div class="dialog-heading">
          <h2 id="appearance-heading">${this.draft ? "Customize theme" : "Appearance"}</h2>
          <button
            type="button"
            aria-label="Close appearance"
            title="Close appearance"
            @click=${this.close}
          >
            ${closeIcon()}
          </button>
        </div>
        ${this.draft ? html`<theme-editor .initial=${this.draft} @theme-save=${this.save} @theme-cancel=${this.cancelEdit}></theme-editor>` : this.renderSelectors()}
        <input
          type="file"
          accept=".json,application/json"
          hidden
          @change=${(event: Event) => {
            void this.importFile(getInput(event).files?.[0]);
          }}
        />
        <p role="status">${this.message}</p>
        ${this.error ? html`<p role="alert">${this.error}</p>` : nothing}
      </dialog>
    `;
  }
}
customElements.define("appearance-panel", AppearancePanel);
