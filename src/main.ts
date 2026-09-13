import * as Obsidian from "obsidian";
import { addMoveSelectedItems } from "./move-menu";

export class MoveFilesHerePlugin extends Obsidian.Plugin {
  onload(): void {
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file, source) => {
        if (source === "file-explorer-context-menu" && file instanceof Obsidian.TFolder) {
          addMoveSelectedItems(this.app, menu, file);
        }
      }),
    );
  }
}

export default MoveFilesHerePlugin;
