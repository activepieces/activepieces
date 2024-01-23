import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs';
import { FolderActions } from './folders.actions';
import { FoldersSelectors } from './folders.selector';
import { GenericSnackbarTemplateComponent } from '@activepieces/ui/common';

@Injectable()
export class FoldersEffects {
  flowMoved$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(FolderActions.moveFlow),
        concatLatestFrom(() => {
          return this.store.select(FoldersSelectors.selectFolders);
        }),
        tap(([actions, folders]) => {
          const folderName =
            actions.targetFolderId === 'NULL'
              ? $localize`Uncategorized`
              : folders.find((f) => f.id === actions.targetFolderId)
                  ?.displayName || '';
          this.snackbar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `Moved to <b> ${folderName}</b>`,
          });
        })
      );
    },
    { dispatch: false }
  );
  folderAdded$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(FolderActions.addFolder),
        tap((action) => {
          this.snackbar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `<b>${action.folder.displayName}</b> added`,
          });
        })
      );
    },
    { dispatch: false }
  );
  folderRenamed$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(FolderActions.renameFolder),
        tap((action) => {
          this.snackbar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `Renamed to <b>${action.newName}</b>`,
          });
        })
      );
    },
    { dispatch: false }
  );
  folderDeleted$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(FolderActions.deleteFolder),
        concatLatestFrom(() => {
          return this.store.select(FoldersSelectors.selectFolders);
        }),
        tap(([actions, folders]) => {
          const folderName =
            folders.find((f) => f.id === actions.folderId)?.displayName || '';
          this.snackbar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `<b>${folderName}</b> deleted`,
          });
        })
      );
    },
    { dispatch: false }
  );
  constructor(
    private store: Store,
    private actions$: Actions,
    private snackbar: MatSnackBar
  ) {}
}
