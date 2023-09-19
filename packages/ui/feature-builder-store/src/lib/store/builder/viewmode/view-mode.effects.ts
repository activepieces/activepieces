import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { BuilderActions } from '../builder.action';
import { of, switchMap } from 'rxjs';
import { ViewModeEnum } from '../../../model/enums/view-mode.enum';
import { ViewModeActions } from './view-mode.action';

@Injectable()
export class ViewModeEffects {
  constructor(private actions$: Actions) {}

  loadInitial$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BuilderActions.loadInitial),
      switchMap(({ viewMode }: { viewMode: ViewModeEnum }) => {
        return of(
          ViewModeActions.setInitial({
            viewMode: viewMode,
          })
        );
      })
    );
  });
}
