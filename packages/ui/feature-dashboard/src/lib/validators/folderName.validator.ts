import { Observable, map } from 'rxjs';
import { Folder } from '@activepieces/shared';
import { AbstractControl } from '@angular/forms';

export class FolderValidator {
  static createValidator(allFolders$: Observable<Folder[]>, folderId?: string) {
    return (control: AbstractControl) => {
      const currentName = control.value;
      return allFolders$.pipe(
        map((folder) => {
          const folderNameUsed = !!folder.find(
            (f) => f.displayName === currentName && folderId !== f.id
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
