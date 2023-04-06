import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  EMPTY,
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
import { BuilderSelectors, FlowsActions } from '@activepieces/ui/feature-builder-store';

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
  constructor(testStepService: TestStepService, private store: Store) {
    super(testStepService);
    this.initialObservables();
  }

  private initialObservables() {
    this.setSelectedDataControlListener();
    this.initialHistoricalData$ = this.store
      .select(BuilderSelectors.selectCurrentFlowId)
      .pipe(
        switchMap((res) => {
          return this.testStepService.getTriggerEventsResults(res?.toString() || '');
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
      .select(BuilderSelectors.selectStepSelectedSampleData)
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
    this.testStep$ = this.store
      .select(BuilderSelectors.selectCurrentFlowId)
      .pipe(
        take(1),
        switchMap((id) => {
          if (id) {
            const stopListening$ = merge(
              this.cancelTesting$,
              this.foundNewResult$
            );
            return interval(500).pipe(
              takeUntil(stopListening$),
              switchMap(() => {
                return this.createResultsChecker(id.toString());
              })
            );
          }
          return EMPTY;
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
