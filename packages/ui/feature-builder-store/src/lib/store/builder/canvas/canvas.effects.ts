import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { filter, map, switchMap, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { BuilderActions } from '../builder.action';
import { canvasActions } from './canvas.action';
import { EMPTY, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BuilderSelectors } from '../builder.selector';
import {
  LeftSideBarType,
  RightSideBarType,
  ViewModeEnum,
} from '../../../model';
import { RunDetailsService } from '../../../service/run-details.service';
import { ViewModeActions } from '../viewmode/view-mode.action';

@Injectable()
export class CanvasEffects {
  loadInitial$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BuilderActions.loadInitial),
      map((action) => {
        return canvasActions.setInitial({
          displayedFlowVersion: action.flow.version,
          run: action.run,
        });
      })
    );
  });
  clearAddBtnIdOnClosingRightSidebar$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(canvasActions.setRightSidebar),
      filter((action) => action.sidebarType === RightSideBarType.NONE),
      switchMap(() => {
        return of(canvasActions.clearAddButtonId());
      })
    );
  });
  clearAddBtnIdOnStepSelection$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(canvasActions.selectStepByName),
      switchMap(() => {
        return of(canvasActions.clearAddButtonId());
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
  generateFlowSuccessful$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(canvasActions.generateFlowSuccessful),
      map(() => {
        return ViewModeActions.setViewMode({ viewMode: ViewModeEnum.BUILDING });
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
