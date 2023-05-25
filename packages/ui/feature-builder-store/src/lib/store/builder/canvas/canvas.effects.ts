import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { BuilderActions } from '../builder.action';
import { canvasActions } from './canvas.action';

@Injectable()
export class FlowInstanceEffects {
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

  constructor(private actions$: Actions, private store: Store) {}
}
