import * as Obsidian from "obsidian";
import { isValidMoveTarget, moveAbstractFiles } from "./move-abstract-files";

const MOVE_SECTION = "move-selected-files-here-context-menu";

// File explorer selection and menu ordering are not exposed by the public API.
type ExplorerView = Obsidian.View & {
  tree?: {
    selectedDoms?: Set<{ file: Obsidian.TAbstractFile }>;
  };
};
type OrderedMenu = Obsidian.Menu & { sections?: string[] };

export function addMoveSelectedFiles(
  app: Obsidian.App,
  menu: Obsidian.Menu,
  destination: Obsidian.TFolder,
): void {
  const explorer = app.workspace.getLeavesOfType("file-explorer")[0]?.view as
    | ExplorerView
    | undefined;
  const tree = explorer?.tree;
  const selected = Array.from(tree?.selectedDoms ?? [], (dom) => dom.file);
  // Intentionally include the active note because the sidebar visually marks it as selected.
  const activeFile = app.workspace.getActiveFile();
  if (activeFile && !selected.includes(activeFile)) {
    selected.push(activeFile);
  }
  if (!selected.length) return;

  // Capture the selection before closing the menu can change it.
  if (
    !selected.every((file) => isValidMoveTarget(file, destination)) ||
    selected.every((file) => file.parent === destination)
  ) {
    return;
  }

  menu.addItem((menuItem) => {
    menuItem
      .setTitle(selected.length === 1 ? "Move selected file here." : "Move selected files here.")
      .setIcon("folder-input")
      .setSection(MOVE_SECTION)
      .onClick(async () => {
        const { skipped, failures } = await moveAbstractFiles(app, selected, destination);
        for (const { file, error } of failures) {
          console.error("Could not move selected file.", file.path, error);
        }
        if (skipped || failures.length) {
          new Obsidian.Notice(
            `Move selected files: ${skipped} skipped, ${failures.length} failed.`,
          );
        }
      });
  });

  // Move section to the top of context menu
  const sections = (menu as OrderedMenu).sections;
  if (Array.isArray(sections)) {
    const existing = sections.indexOf(MOVE_SECTION);
    if (existing !== -1) sections.splice(existing, 1);
    sections.unshift(MOVE_SECTION);
    // Include unsectioned menu entries so Obsidian also separates them from our action.
    if (!sections.includes("")) sections.push("");
  } else {
    menu.addSeparator();
  }
}
