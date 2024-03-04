import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  delay,
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
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';

export interface TriggerHistoricalData {
  payload: unknown;
  created: string;
}
@Component({
  selector: 'app-test-piece-webhook-trigger',
  templateUrl: './test-piece-webhook-trigger.component.html',
})
export class TestPieceWebhookTriggerComponent extends TestStepCoreComponent {
  currentResults$: BehaviorSubject<TriggerHistoricalData[]>;
  testStep$: Observable<TriggerHistoricalData[]>;
  foundNewResult$: Subject<boolean> = new Subject();
  testing = false;
  savingMockData = false;
  selectedDataControl: FormControl<unknown> = new FormControl();
  saveNewSelectedData$: Observable<void>;
  initialHistoricalData$: Observable<TriggerHistoricalData[]>;
  initaillySelectedSampleData$: Observable<unknown>;
  stopSelectedDataControlListener$ = new Subject<boolean>();
  cancelTesting$ = new Subject<boolean>();
  saveAfterNewDataIsLoaded$: Observable<void>;
  startSimulating$: Observable<void>;
  simulationMessage$: Observable<string | null>;
  isValid$: Observable<boolean>;
  deleteWebhookSimulation$: Observable<void>;
  useMockData$: Observable<void>;
  test: Observable<unknown>;
  pieceSampleData$: Observable<unknown>;
  constructor(
    testStepService: TestStepService,
    store: Store,
    private actionMetaService: PieceMetadataService
  ) {
    super(testStepService, store);
    this.initialObservables();
    this.setSimultionMessage();
  }

  private initialObservables() {
    this.isValid$ = this.store.select(BuilderSelectors.selectStepValidity);
    this.setSelectedDataControlListener();
    this.initialHistoricalData$ = this.store
      .select(BuilderSelectors.selectCurrentFlow)
      .pipe(
        take(1),
        switchMap((flow) => {
          if (flow && flow.id) {
            return this.testStepService.getTriggerEventsResults(
              flow.id.toString()
            );
          }
          throw new Error('No flow is selected');
        }),
        map((res) => {
          return res.data;
        }),
        tap((res) => {
          this.currentResults$ = new BehaviorSubject<TriggerHistoricalData[]>(
            res
          );
        })
      );

    this.pieceSampleData$ = this.store
      .select(BuilderSelectors.selectCurrentStep)
      .pipe(
        take(1),
        switchMap((step) => {
          if (step && step.type === TriggerType.PIECE) {
            return this.actionMetaService
              .getPieceMetadata(
                step.settings.pieceName,
                step.settings.pieceVersion
              )
              .pipe(
                map((piece) => {
                  return piece.triggers[step.settings.triggerName].sampleData;
                })
              );
          }
          return of(null);
        })
      );

    this.initaillySelectedSampleData$ = this.store
      .select(BuilderSelectors.selectStepTestSampleData)
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
    this.testing = true;
    this.testStep$ = this.store.select(BuilderSelectors.selectCurrentFlow).pipe(
      take(1),
      tap((flow) => {
        this.startSimulating$ = this.testStepService
          .startPieceWebhookSimulation(flow.id.toString())
          .pipe(map(() => void 0));
      }),
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
          this.testing = false;
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
          if (step && step.type === TriggerType.PIECE) {
            const clone = { ...step };
            clone.settings = {
              ...clone.settings,
              inputUiInfo: {
                currentSelectedData: this.selectedDataControl.value,
                lastTestDate: new Date().toString(),
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
    this.testing = false;
    this.cancelTesting$.next(true);
    this.deleteWebhookSimulation$ = this.store
      .select(BuilderSelectors.selectCurrentFlow)
      .pipe(
        switchMap((flow) => {
          if (flow.id) {
            return this.testStepService.deletePieceWebhookSimulation(
              flow.id.toString()
            );
          }
          throw new Error('flow Id is null');
        }),
        map(() => {
          return void 0;
        })
      );
  }
  setSimultionMessage() {
    this.simulationMessage$ = this.store
      .select(BuilderSelectors.selectCurrentStep)
      .pipe(
        take(1),
        switchMap((res) => {
          if (res && res.type === TriggerType.PIECE) {
            return this.actionMetaService
              .getPieceMetadata(
                res.settings.pieceName,
                res.settings.pieceVersion
              )
              .pipe(
                map((metaData) => {
                  const trigger = metaData.triggers[res.settings.triggerName];
                  return `Please go to ${metaData.displayName} and trigger ${trigger.displayName}`;
                })
              );
          }
          return of(null);
        })
      );
  }

  useMockData() {
    this.testing = true;
    this.savingMockData = true;
    this.testStep$ = this.store.select(BuilderSelectors.selectCurrentFlow).pipe(
      take(1),
      switchMap((flow) => {
        return this.store.select(BuilderSelectors.selectCurrentStep).pipe(
          take(1),
          switchMap((step) => {
            if (step && step.type === TriggerType.PIECE) {
              return this.actionMetaService
                .getPieceMetadata(
                  step.settings.pieceName,
                  step.settings.pieceVersion
                )
                .pipe(
                  map((piece) => {
                    return piece.triggers[step.settings.triggerName].sampleData;
                  }),
                  switchMap((mockdata) => {
                    if (step && step.type === TriggerType.PIECE) {
                      return this.testStepService
                        .savePieceWebhookTriggerMockdata(flow.id, mockdata)
                        .pipe(
                          delay(1500),
                          map((serverSavedMockdata) => [serverSavedMockdata]),
                          tap((resultsList) => {
                            this.currentResults$.next(resultsList);
                            this.selectedDataControl.setValue(
                              resultsList[0].payload
                            );
                            this.testStepService.elevateResizer$.next(true);
                            this.testing = false;
                            this.savingMockData = false;
                          })
                        );
                    }
                    return of([]);
                  })
                );
            }
            console.error(
              'trying to use mock data for a trigger that is not a webhook piece tirgger'
            );
            return of([]);
          })
        );
      })
    );
  }
}
