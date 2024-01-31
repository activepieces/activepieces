import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, switchMap, tap } from 'rxjs';
import { FolderActions } from './folders.actions';
import { FoldersSelectors } from './folders.selectors';
import { GenericSnackbarTemplateComponent } from '@activepieces/ui/common';

@Injectable()
export class FoldersEffects {
  showFlowMovedSnackbar$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(
          FolderActions.moveFlowInFlowsTable,
          FolderActions.moveFlowInBuilder
        ),
        concatLatestFrom(() => {
          return this.store.select(FoldersSelectors.selectFolders);
        }),
        tap(([action, folders]) => {
          const folderName =
            action.targetFolderId === 'NULL'
              ? $localize`Uncategorized`
              : folders.find((f) => f.id === action.targetFolderId)
                  ?.displayName || '';
          this.snackbar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `Moved to <b> ${folderName}</b>`,
          });
        })
      );
    },
    { dispatch: false }
  );
  flowMovedInBuilder$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FolderActions.moveFlowInBuilder),
      switchMap((action) => {
        return of(
          FolderActions.selectFolder({ folderId: action.targetFolderId })
        );
      })
    );
  });
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
