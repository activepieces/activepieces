import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  forkJoin,
  interval,
  map,
  merge,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { TriggerType } from '@activepieces/shared';
import { FormControl } from '@angular/forms';
import deepEqual from 'deep-equal';
import { TestStepCoreComponent } from '../test-steps-core.component';
import { TestStepService } from '@activepieces/ui/common';
import {
  BuilderSelectors,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';

export interface WebhookHistoricalData {
  payload: unknown;
  created: string;
}
@Component({
  selector: 'app-test-webhook-trigger',
  templateUrl: './test-webhook-trigger.component.html',
})
export class TestWebhookTriggerComponent extends TestStepCoreComponent {
  currentResults$: BehaviorSubject<WebhookHistoricalData[]>;
  testStep$: Observable<WebhookHistoricalData[]>;
  foundNewResult$: Subject<boolean> = new Subject();
  loading = false;
  selectedDataControl: FormControl<unknown> = new FormControl();
  saveNewSelectedData$: Observable<void>;
  initialHistoricalData$: Observable<WebhookHistoricalData[]>;
  initaillySelectedSampleData$: Observable<unknown>;
  stopSelectedDataControlListener$ = new Subject<boolean>();
  cancelTesting$ = new Subject<boolean>();
  saveAfterNewDataIsLoaded$: Observable<void>;
  constructor(testStepService: TestStepService, store: Store) {
    super(testStepService, store);
    this.initialObservables();
  }

  private initialObservables() {
    this.setSelectedDataControlListener();
    this.initialHistoricalData$ = this.store
      .select(BuilderSelectors.selectCurrentFlow)
      .pipe(
        switchMap((flow) => {
          return this.testStepService.getTriggerEventsResults(
            flow.id?.toString() || ''
          );
        }),
        map((res) => {
          return res.data;
        }),
        tap((res) => {
          this.currentResults$ = new BehaviorSubject<WebhookHistoricalData[]>(
            res
          );
        })
      );
    this.initaillySelectedSampleData$ = this.store
      .select(BuilderSelectors.selectTriggerSelectedSampleData)
      .pipe(
        tap((res) => {
          this.stopSelectedDataControlListener$.next(true);
          this.selectedDataControl.setValue(res);
          this.setSelectedDataControlListener();
        })
      );
  }

  private setSelectedDataControlListener() {
    this.saveNewSelectedData$ = this.selectedDataControl.valueChanges.pipe(
      takeUntil(this.stopSelectedDataControlListener$),
      tap(() => {
        this.saveNewResultToStep();
      }),
      map(() => void 0)
    );
  }

  testStep() {
    this.loading = true;
    this.testStep$ = this.store.select(BuilderSelectors.selectCurrentFlow).pipe(
      take(1),
      switchMap((flow) => {
        const stopListening$ = merge(this.cancelTesting$, this.foundNewResult$);
        return interval(this.POLLING_TEST_INTERVAL_MS).pipe(
          takeUntil(stopListening$),
          switchMap(() => {
            return this.createResultsChecker(flow.id.toString());
          })
        );
      })
    );
  }

  createResultsChecker(flowId: string) {
    const observables = {
      currentResults: of(this.currentResults$.value),
      resultsChecked: this.testStepService.getTriggerEventsResults(flowId),
    };
    return forkJoin(observables).pipe(
      map((res) => {
        const newResults = [
          ...res.resultsChecked.data.filter(
            (e) =>
              res.currentResults.find((res) => res.created === e.created) ===
              undefined
          ),
        ];

        if (newResults.length > 0) {
          this.loading = false;
          this.selectedDataControl.setValue(
            newResults[newResults.length - 1].payload
          );
          this.foundNewResult$.next(true);
          const resultsList = [...newResults, ...res.currentResults];
          this.currentResults$.next(resultsList);
          this.testStepService.elevateResizer$.next(true);
          return resultsList;
        }
        return [];
      })
    );
  }
  saveNewResultToStep() {
    this.saveAfterNewDataIsLoaded$ = this.store
      .select(BuilderSelectors.selectCurrentStep)
      .pipe(
        take(1),
        tap((step) => {
          if (step && step.type === TriggerType.WEBHOOK) {
            const clone = { ...step };
            clone.settings = {
              inputUiInfo: {
                currentSelectedData: this.selectedDataControl.value,
              },
            };
            this.store.dispatch(
              FlowsActions.updateTrigger({
                operation: clone,
              })
            );
          }
        }),
        map(() => void 0)
      );
  }
  dropdownCompareWithFunction = (opt: unknown, formControlValue: unknown) => {
    return formControlValue !== undefined && deepEqual(opt, formControlValue);
  };
  cancelTesting() {
    this.loading = false;
    this.cancelTesting$.next(true);
  }
}
