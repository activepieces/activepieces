import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { BuilderActions } from '../builder.action';
import { canvasActions } from './canvas.action';
import { EMPTY, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BuilderSelectors } from '../builder.selector';
import { LeftSideBarType } from '../../../model';
import { RunDetailsService } from '../../../service/run-details.service';

@Injectable()
export class CanvasEffects {
  loadInitial$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BuilderActions.loadInitial),
      map((action) => {
        return canvasActions.setInitial({
          displayedFlowVersion: action.publishedVersion
            ? action.publishedVersion
            : action.flow.version,
        });
      })
    );
  });
  removeStepSelection$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(canvasActions.setRightSidebar),
      switchMap((action) => {
        if (action.deselectCurrentStep) {
          return of(canvasActions.deselectStep());
        }
        return EMPTY;
      })
    );
  });
  openGenerateFlowComponent$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(canvasActions.openGenerateFlowComponent),
        tap(() => {
          this.snackBar.dismiss();
        })
      );
    },
    { dispatch: false }
  );
  exitRun$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(canvasActions.exitRun),
      concatLatestFrom(() =>
        this.store.select(BuilderSelectors.selectCurrentLeftSidebarType)
      ),
      switchMap(([action, leftSideBar]) => {
        switch (leftSideBar) {
          case LeftSideBarType.SHOW_RUN:
            return of(
              canvasActions.setLeftSidebar({
                sidebarType: LeftSideBarType.NONE,
              })
            );
          case LeftSideBarType.NONE:
            return EMPTY;
        }
      })
    );
  });
  setRun$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(canvasActions.setRun),
      concatLatestFrom(() => [
        this.store.select(BuilderSelectors.selectCurrentFlow),
      ]),
      tap(([{ run }, currentRun]) => {
        if (run.id !== currentRun?.id) {
          this.runDetailsService.currentStepResult$.next(undefined);
        }
      }),
      switchMap(([run]) => {
        return of(
          canvasActions.setLeftSidebar({
            sidebarType: LeftSideBarType.SHOW_RUN,
          })
        );
      })
    );
  });

  constructor(
    private actions$: Actions,
    private store: Store,
    private snackBar: MatSnackBar,
    private runDetailsService: RunDetailsService
  ) {}
}
