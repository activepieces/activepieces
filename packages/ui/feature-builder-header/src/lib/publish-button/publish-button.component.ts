import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, of } from 'rxjs';
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
  flowState$: Observable<{
    isSaving: boolean;
    isPublishing: boolean;
    isCurrentFlowVersionPublished: boolean;
  }>;
  isDeployingOrIsSaving$: Observable<boolean>;
  deploying$: Observable<boolean> = of(false);
  disablePublishButton$: Observable<boolean>;
  buttonTooltipText$: Observable<string>;
  buttonText$: Observable<string>;
  isCurrentFlowVersionPublished$: Observable<boolean>;
  constructor(private store: Store) {}

  ngOnInit(): void {
    this.setFlowStateListener();
  }

  private setFlowStateListener() {
    this.isCurrentFlowVersionPublished$ = this.store.select(
      BuilderSelectors.selectIsCurrentVersionPublished
    );
    this.flowState$ = combineLatest({
      isSaving: this.store.select(BuilderSelectors.selectIsSaving),
      isPublishing: this.store.select(BuilderSelectors.selectIsPublishing),
      isCurrentFlowVersionPublished: this.isCurrentFlowVersionPublished$,
    });
    this.disablePublishButton$ = combineLatest({
      publishingSavingStates: this.flowState$,
      flowHasSteps: this.store.select(BuilderSelectors.selectFlowHasAnySteps),
      flowValid: this.store.select(BuilderSelectors.selectCurrentFlowValidity),
      isCurrentFlowVersionPublished: this.isCurrentFlowVersionPublished$,
    }).pipe(
      map((res) => {
        return (
          res.publishingSavingStates.isPublishing ||
          res.publishingSavingStates.isSaving ||
          !res.flowHasSteps ||
          !res.flowValid ||
          res.isCurrentFlowVersionPublished
        );
      })
    );
    this.buttonTooltipText$ = combineLatest({
      buttonIsDisabled: this.disablePublishButton$,
      flowHasSteps: this.store.select(BuilderSelectors.selectFlowHasAnySteps),
      isCurrentFlowVersionPublished: this.isCurrentFlowVersionPublished$,
    }).pipe(
      map((res) => {
        if (!res.flowHasSteps) {
          return 'Add 1 more step to publish';
        } else if (res.buttonIsDisabled) {
          return 'Your flow has invalid steps';
        } else if (res.isCurrentFlowVersionPublished) {
          return 'Published';
        }
        return 'Publish Flow';
      })
    );
    this.buttonText$ = this.flowState$.pipe(
      map((res) => {
        if (res.isSaving) {
          return 'Saving';
        } else if (res.isPublishing) {
          return 'Publishing';
        } else if (res.isCurrentFlowVersionPublished) {
          return 'Published';
        }
        return 'Publish';
      })
    );
  }

  publish() {
    this.store.dispatch(FlowInstanceActions.publish());
  }
}
