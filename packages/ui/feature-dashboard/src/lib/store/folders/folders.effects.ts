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
              ? 'Uncategorized'
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

  constructor(
    private store: Store,
    private actions$: Actions,
    private snackbar: MatSnackBar
  ) {}
}
