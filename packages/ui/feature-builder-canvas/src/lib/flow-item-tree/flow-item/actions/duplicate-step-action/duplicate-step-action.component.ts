import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  BuilderSelectors,
  FlowItem,
} from '@activepieces/ui/feature-builder-store';
import { Observable, forkJoin, map, take, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { TriggerType, flowHelper } from '@activepieces/shared';
@Component({
  selector: 'app-duplicate-step-action',
  templateUrl: './duplicate-step-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateStepActionComponent {
  @Input({ required: true })
  flowItem: FlowItem;
  duplicate$: Observable<void> | undefined;
  constructor(private store: Store) {}
  duplicateStep() {
    this.duplicate$ = forkJoin({
      currentFlow: this.store
        .select(BuilderSelectors.selectCurrentFlow)
        .pipe(take(1)),
      currentStep: this.store
        .select(BuilderSelectors.selectCurrentStep)
        .pipe(take(1)),
    }).pipe(
      tap(() => {
        if (
          this.flowItem &&
          this.flowItem.type !== TriggerType.WEBHOOK &&
          this.flowItem.type !== TriggerType.PIECE &&
          this.flowItem.type !== TriggerType.EMPTY
        ) {
          console.log(flowHelper.duplicateStep(this.flowItem));
        }
      }),
      map(() => void 0)
    );
  }
}
