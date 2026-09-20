import * as Obsidian from "obsidian";

export interface MoveAbstractFilesResult {
  moved: number;
  skipped: number;
  failures: { file: Obsidian.TAbstractFile; error: unknown }[];
}

/**
 * Move files and folders the way Obsidian's file explorer drag-and-drop does:
 * suffix conflicting names, update links, and if any item can't be moved into
 * `destination`, move none of them. Descendants of a selected folder move
 * with that folder rather than being moved again individually.
 */
export async function moveAbstractFiles(
  app: Obsidian.App,
  files: readonly Obsidian.TAbstractFile[],
  destination: Obsidian.TFolder,
): Promise<MoveAbstractFilesResult> {
  if (files.some((file) => !isValidMoveTarget(file, destination))) {
    return { moved: 0, skipped: files.length, failures: [] };
  }

  const fileSet = new Set(files);
  // A folder carries its descendants; do not move those a second time.
  const roots = files.filter((file) => {
    for (let parent = file.parent; parent; parent = parent.parent) {
      if (fileSet.has(parent)) return false;
    }
    return true;
  });

  let skipped = 0;
  let moved = 0;
  const failures: MoveAbstractFilesResult["failures"] = [];
  for (const file of roots) {
    if (file.parent === destination) {
      skipped++;
      continue;
    }
    try {
      const extension = file instanceof Obsidian.TFile ? file.extension : "";
      const name = extension
        ? file.name.slice(0, -(extension.length + 1))
        : file.name;
      const basePath = destination.isRoot()
        ? name
        : destination.path + "/" + name;
      const path = getAvailablePath(app, basePath, extension);
      // Sequential moves let each subsequent item see names already taken.
      await app.fileManager.renameFile(file, path);
      moved++;
    } catch (error) {
      failures.push({ file, error });
    }
  }
  return { moved, skipped, failures };
}

export function isValidMoveTarget(
  file: Obsidian.TAbstractFile,
  destination: Obsidian.TFolder,
): boolean {
  return (
    file !== destination &&
    !(file instanceof Obsidian.TFolder && file.isRoot()) &&
    !(
      file instanceof Obsidian.TFolder &&
      destination.path.startsWith(file.path + "/")
    )
  );
}

// Case-insensitive existence check; not exposed by the public API.
type VaultInsensitiveLookup = Obsidian.Vault & {
  getAbstractFileByPathInsensitive?(
    path: string,
  ): Obsidian.TAbstractFile | null;
};

function pathExists(app: Obsidian.App, path: string): boolean {
  const vault = app.vault as VaultInsensitiveLookup;
  const file =
    vault.getAbstractFileByPathInsensitive?.(path) ??
    app.vault.getAbstractFileByPath(path);
  return file !== null;
}

function getAvailablePath(
  app: Obsidian.App,
  basePath: string,
  extension: string,
): string {
  const join = (path: string) => (extension ? path + "." + extension : path);
  let path = join(basePath);
  for (let n = 1; pathExists(app, path); n++) {
    path = join(basePath + " " + n);
  }
  return path;
}
