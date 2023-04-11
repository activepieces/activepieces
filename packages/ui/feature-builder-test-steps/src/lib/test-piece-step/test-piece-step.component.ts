import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestStepService } from '@activepieces/ui/common';
import {
  Observable,
  distinctUntilChanged,
  forkJoin,
  map,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { ActionType } from '@activepieces/shared';
import { TestStepCoreComponent } from '../test-steps-core.component';
import deepEqual from 'deep-equal';

@Component({
  selector: 'app-test-piece-step',
  templateUrl: './test-piece-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestPieceStepComponent extends TestStepCoreComponent {
  loading = false;
  testStep$: Observable<unknown>;
  currentStepValidity$: Observable<boolean>;
  lastTestResult$: Observable<unknown | undefined>;
  saveStepAfterTesting$: Observable<void>;
  constructor(testStepService: TestStepService, private store: Store) {
    super(testStepService);
    this.currentStepValidity$ = this.store.select(
      BuilderSelectors.selectStepValidity
    );
    this.lastTestResult$ = this.store
      .select(BuilderSelectors.selectStepTestSampleData)
      .pipe(
        distinctUntilChanged((prev, current) => {
          return deepEqual(prev, current);
        })
      );
  }
  testStep() {
    if (!this.loading) {
      this.loading = true;
      const observables = {
        collectionId: this.store
          .select(BuilderSelectors.selectCurrentCollectionId)
          .pipe(take(1)),
        flowVersionId: this.store
          .select(BuilderSelectors.selectCurrentFlowVersionId)
          .pipe(take(1)),
        stepName: this.store
          .select(BuilderSelectors.selectCurrentStepName)
          .pipe(take(1)),
      };
      this.testStep$ = forkJoin(observables).pipe(
        switchMap((res) => {
          if (!res.collectionId || !res.flowVersionId || !res.stepName) {
            throw new Error('some test piece step params are missing');
          }
          return this.testStepService.testPieceStep(res);
        }),
        tap((res) => {
          this.loading = false;
          if (res) {
            this.saveStepTestResult(res);
          } else {
            this.saveStepTestResult('' + res);
          }
        })
      );
    }
  }
  saveStepTestResult(testResult: unknown) {
    this.saveStepAfterTesting$ = this.store
      .select(BuilderSelectors.selectCurrentStep)
      .pipe(
        take(1),
        tap((step) => {
          if (step && step.type === ActionType.PIECE) {
            const clone = { ...step };
            clone.settings = {
              ...clone.settings,
              inputUiInfo: {
                customizedInputs: clone.settings.inputUiInfo.customizedInputs,
                currentSelectedData: testResult,
              },
            };
            this.store.dispatch(
              FlowsActions.updateAction({
                operation: clone,
              })
            );
          }
        }),
        map(() => void 0)
      );
  }
}
