import { Observable, map, of } from 'rxjs';
import { Folder } from '@activepieces/shared';
import { AbstractControl } from '@angular/forms';

export class FolderValidator {
  static createValidator(allFolders$: Observable<Folder[]>, folderId?: string) {
    return (control: AbstractControl) => {
      const currentName: string = control.value;
      if (currentName.trim().length === 0) {
        return of({ emptyName: true });
      }
      return allFolders$.pipe(
        map((folder) => {
          const folderNameUsed = !!folder.find(
            (f) =>
              f.displayName.trim().toLowerCase() ===
                currentName.trim().toLowerCase() && folderId !== f.id
          );
          if (folderNameUsed) {
            return { nameUsed: true };
          }
          return null;
        })
      );
    };
  }
}
