import * as Obsidian from "obsidian";
import { addMoveSelectedItems } from "./move-menu";

export class SelectFileForMovePlugin extends Obsidian.Plugin {
  onload(): void {
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file, source) => {
        if (
          source === "file-explorer-context-menu" &&
          file instanceof Obsidian.TFolder
        ) {
          try {
            addMoveSelectedItems(this.app, menu, file);
          } catch (error) {
            console.error(
              "Move Files Here: failed to add context menu.",
              error,
            );
            new Obsidian.Notice(
              "Move Files Here: failed to add context menu. Open dev tools for detailed error message.",
            );
          }
        }
      }),
    );
  }
}

export default SelectFileForMovePlugin;
