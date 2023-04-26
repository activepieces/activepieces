import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, delay, map, Observable, of } from 'rxjs';
import {
  BuilderSelectors,
  FlowInstanceActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-publish-button',
  templateUrl: './publish-button.component.html',
  styleUrls: ['./publish-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishButtonComponent implements OnInit {
  flowState$: Observable<{ isSaving: boolean; isPublishing: boolean }>;
  isDeployingOrIsSaving$: Observable<boolean>;
  deploying$: Observable<boolean> = of(false);
  disablePublishButton$: Observable<boolean>;
  buttonTooltipText$: Observable<string>;
  buttonText$: Observable<string>;
  constructor(private store: Store) {}

  ngOnInit(): void {
    this.setFlowStateListener();
  }

  private setFlowStateListener() {
    this.flowState$ = combineLatest({
      isSaving: this.store.select(BuilderSelectors.selectIsSaving),
      isPublishing: this.store.select(BuilderSelectors.selectIsPublishing),
    });
    this.disablePublishButton$ = combineLatest({
      publishingSavingStates: this.flowState$,
      flowHasSteps: this.store.select(BuilderSelectors.selectFlowHasAnySteps),
      flowValid: this.store.select(BuilderSelectors.selectCurrentFlowValidity),
    }).pipe(
      map((res) => {
        return (
          res.publishingSavingStates.isPublishing ||
          res.publishingSavingStates.isSaving ||
          !res.flowHasSteps ||
          !res.flowValid
        );
      })
    );
    this.buttonTooltipText$ = combineLatest({
      buttonIsDisabled: this.disablePublishButton$,
      flowHasSteps: this.store.select(BuilderSelectors.selectFlowHasAnySteps),
    }).pipe(
      delay(100),
      map((res) => {
        if (!res.flowHasSteps) {
          return 'Flow has to have atleast one step after its trigger';
        } else if (res.buttonIsDisabled) {
          return 'Please fix the flow';
        }
        return 'Publish Flow';
      })
    );
    this.buttonText$ = this.flowState$.pipe(
      delay(100),
      map((res) => {
        if (res.isSaving) {
          return 'Saving';
        } else if (res.isPublishing) {
          return 'Publishing';
        }
        return 'Publish';
      })
    );
  }

  publish() {
    this.store.dispatch(FlowInstanceActions.publish());
  }
}
