import * as Obsidian from "obsidian";
import { addMoveSelectedFiles } from "./move-menu";

export class MoveSelectedFilesHerePlugin extends Obsidian.Plugin {
  onload(): void {
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file, source) => {
        if (source === "file-explorer-context-menu" && file instanceof Obsidian.TFolder) {
          try {
            addMoveSelectedFiles(this.app, menu, file);
          } catch (error) {
            console.error("Move Selected Files Here: failed to add context menu.", error);
            new Obsidian.Notice(
              "Move Selected Files Here: failed to add context menu. Open dev tools for detailed error message.",
            );
          }
        }
      }),
    );
  }
}

export default MoveSelectedFilesHerePlugin;
