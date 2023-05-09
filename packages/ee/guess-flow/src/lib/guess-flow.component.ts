import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  FlowsActionType,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { Flow } from '@activepieces/shared';
import { AnimationOptions } from 'ngx-lottie';
import { Actions, ofType } from '@ngrx/effects';
@Component({
  selector: 'app-guess-flow',
  templateUrl: './guess-flow.component.html',
  styleUrls: ['./guess-flow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuessFlowComponent {
  closeContainer = new Subject<boolean>();
  guessFlow$: Observable<Flow>;
  options: AnimationOptions = {
    path: '/assets/lottie/flow.json',
  };
  constructor(private store: Store, private actions: Actions) {}
  guessFlow(prompt: string) {
    this.store.dispatch(FlowsActions.generateFlow({ prompt: prompt }));
    this.guessFlow$ = this.actions.pipe(
      ofType(FlowsActionType.GENERATE_FLOW_SUCCESSFUL),
      tap(() => {
        this.closeContainer.next(true);
      })
    );
  }
}
