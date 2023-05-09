import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, Subject, switchMap, take, tap } from 'rxjs';
import { FlowService } from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { Flow, FlowOperationType } from '@activepieces/shared';
import { AnimationOptions } from 'ngx-lottie';
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
  constructor(private flowService: FlowService, private store: Store) {}
  guessFlow(prompt: string) {
    this.guessFlow$ = this.store
      .select(BuilderSelectors.selectCurrentFlow)
      .pipe(
        take(1),
        switchMap((flow) => {
          return this.flowService.update(flow.id, {
            type: FlowOperationType.GENERATE_FLOW,
            request: { prompt: prompt },
          });
        }),
        tap((res) => {
          this.store.dispatch(
            FlowsActions.setFlowAFterGenerating({ flow: res })
          );
          this.closeContainer.next(true);
        })
      );
  }
}
