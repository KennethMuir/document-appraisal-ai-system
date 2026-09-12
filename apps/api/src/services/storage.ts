import { promises as fs } from "node:fs";
import path from "node:path";

export type StorageProvider =
  | "LOCAL"
  | "SERVER"
  | "CLOUD";

export type StoredDocument = {
  provider: StorageProvider;
  reference: string;
  localPath: string;
};

export interface FileStorageService {
  store(
    temporaryPath: string,
    storedFilename: string
  ): Promise<StoredDocument>;

  exists(
    reference: string
  ): Promise<boolean>;

  resolve(
    reference: string
  ): string;
}

export class LocalFileStorage
  implements FileStorageService
{
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  async store(
    temporaryPath: string,
    storedFilename: string
  ): Promise<StoredDocument> {
    const targetPath = path.join(
      this.root,
      storedFilename
    );

    await fs.rename(
      temporaryPath,
      targetPath
    );

    return {
      provider: "LOCAL",
      reference: targetPath,
      localPath: targetPath,
    };
  }

  async exists(
    reference: string
  ): Promise<boolean> {
    try {
      await fs.access(
        this.resolve(reference)
      );
      return true;
    } catch {
      return false;
    }
  }

  resolve(
    reference: string
  ): string {
    return path.resolve(reference);
  }
}
