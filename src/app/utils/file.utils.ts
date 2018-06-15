import * as _path from 'path';
import { mkdirSync } from 'fs';

export class FileUtils {
  public static getAbsolutePath(currentPath: string, path: string): string {
    if (path.startsWith('/')) {
      return path;
    } else {
      return _path.join(currentPath, path);
    }
  }

  public static mkdirParent(dir: string, mode?: number | string | null): void {
    console.log('mkdirParent', dir);

    try {
      mkdirSync(dir, mode);
    } catch (e) {
      if (e.code === 'ENOENT') {
        FileUtils.mkdirParent(_path.dirname(dir), mode);
        FileUtils.mkdirParent(dir, mode);
      }
    }
  }
}