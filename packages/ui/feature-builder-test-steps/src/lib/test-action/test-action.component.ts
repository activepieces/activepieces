import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TestStepService } from '@activepieces/ui/common';
import {
  Observable,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  FlowsActions,
  Step,
} from '@activepieces/ui/feature-builder-store';
import {
  ActionType,
  BranchAction,
  CodeAction,
  LoopOnItemsAction,
  PieceAction,
} from '@activepieces/shared';
import { TestStepCoreComponent } from '../test-steps-core.component';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-test-action',
  templateUrl: './test-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestActionComponent extends TestStepCoreComponent {
  loading = false;
  testStep$: Observable<unknown>;
  currentStepValidity$: Observable<boolean>;
  lastTestResult$: Observable<unknown | undefined>;
  saveStepAfterTesting$: Observable<void>;
  lastTestDate$: Observable<string | undefined>;
  errorResponse: null | unknown = null;
  private _step?: Step;
  @Input({ required: true }) set step(val: Step) {
    if (this._step && this._step.name !== val.name) {
      this.errorResponse = null;
    }
    this._step = val;
  }

  constructor(
    testStepService: TestStepService,
    store: Store,
    private snackBar: MatSnackBar
  ) {
    super(testStepService, store);
    this.currentStepValidity$ = this.store.select(
      BuilderSelectors.selectStepValidity
    );
    this.lastTestResult$ = this.store.select(
      BuilderSelectors.selectStepTestSampleDataStringified
    );

    this.lastTestDate$ = this.store.select(BuilderSelectors.selectLastTestDate);
  }
  testStep() {
    if (!this.loading) {
      this.loading = true;
      this.errorResponse = null;
      const observables = {
        flowVersionId: this.store
          .select(BuilderSelectors.selectDraftVersionId)
          .pipe(take(1)),
        stepName: this.store
          .select(BuilderSelectors.selectCurrentStepName)
          .pipe(take(1)),
      };
      this.testStep$ = forkJoin(observables).pipe(
        switchMap((res) => {
          if (!res.flowVersionId || !res.stepName) {
            throw new Error('some test piece step params are missing');
          }
          return this.testStepService
            .testPieceOrCodeStep({
              flowVersionId: res.flowVersionId,
              stepName: res.stepName,
            })
            .pipe(
              tap((res) => {
                this.loading = false;
                this.testStepService.elevateResizer$.next(true);
                if (res.success) {
                  this.saveStepTestResult(res.output);
                } else {
                  this.errorResponse = formatErrorMessage(
                    res.output?.toString() || ''
                  );
                }
              })
            );
        }),

        catchError((err: HttpErrorResponse) => {
          if (err.status === 504) {
            const errorBar = this.snackBar.open(
              'This action timed out, refresh your page and recheck to see the step result',
              'Refresh',
              { duration: undefined, panelClass: 'error' }
            );
            return errorBar.afterDismissed().pipe(tap(() => location.reload()));
          } else {
            this.errorResponse = err;
            this.loading = false;
            return of({});
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
          if (step) {
            switch (step.type) {
              case ActionType.PIECE: {
                const clone: PieceAction = {
                  ...step,
                  settings: {
                    ...step.settings,
                    inputUiInfo: {
                      customizedInputs:
                        step.settings.inputUiInfo.customizedInputs,
                      currentSelectedData: testResult
                        ? testResult
                        : testResult === undefined
                        ? 'undefined'
                        : testResult === ''
                        ? ''
                        : JSON.stringify(testResult),
                      lastTestDate: new Date().toString(),
                    },
                  },
                };

                this.store.dispatch(
                  FlowsActions.updateAction({
                    operation: clone,
                  })
                );

                break;
              }
              case ActionType.BRANCH: {
                const clone: BranchAction = {
                  ...step,
                  settings: {
                    ...step.settings,
                    inputUiInfo: {
                      customizedInputs:
                        step.settings.inputUiInfo.customizedInputs,
                      currentSelectedData: testResult
                        ? testResult
                        : testResult === undefined
                        ? 'undefined'
                        : JSON.stringify(testResult),
                      lastTestDate: new Date().toString(),
                    },
                  },
                };

                this.store.dispatch(
                  FlowsActions.updateAction({
                    operation: clone,
                  })
                );

                break;
              }
              case ActionType.CODE: {
                const clone: CodeAction = {
                  ...step,
                  settings: {
                    ...step.settings,
                    inputUiInfo: {
                      currentSelectedData: testResult
                        ? testResult
                        : testResult === undefined
                        ? 'undefined'
                        : testResult === ''
                        ? ''
                        : JSON.stringify(testResult),
                      lastTestDate: new Date().toString(),
                    },
                  },
                };
                this.store.dispatch(
                  FlowsActions.updateAction({
                    operation: clone,
                  })
                );

                break;
              }
              case ActionType.LOOP_ON_ITEMS: {
                if (
                  testResult &&
                  typeof testResult === 'object' &&
                  'item' in testResult &&
                  'index' in testResult
                ) {
                  const item = {
                    index: testResult['index'],
                    item: testResult['item'],
                  };
                  const clone: LoopOnItemsAction = {
                    ...step,
                    settings: {
                      ...step.settings,
                      inputUiInfo: {
                        currentSelectedData: item
                          ? item
                          : item === undefined
                          ? 'undefined'
                          : item === ''
                          ? ''
                          : JSON.stringify(item),
                        lastTestDate: new Date().toString(),
                      },
                    },
                  };
                  this.store.dispatch(
                    FlowsActions.updateAction({
                      operation: clone,
                    })
                  );
                }
                break;
              }

              default:
                break;
            }
          }
        }),
        map(() => void 0)
      );
  }
}

function formatErrorMessage(errorMessage: string): string {
  const errorMessagesSplit = errorMessage.split('Error:');
  if (errorMessagesSplit.length < 2) {
    return errorMessage;
  }

  const indentationStep = '  ';
  return errorMessagesSplit.reduce((acc, current, index) => {
    const indentation = indentationStep.repeat(index);
    return `${acc}${indentation}Error ${index + 1}: ${current.trim()}\n`;
  }, '');
}
