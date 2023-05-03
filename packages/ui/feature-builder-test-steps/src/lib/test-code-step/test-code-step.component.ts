import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  BuilderSelectors,
  CodeService,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import {
  Observable,
  Subject,
  distinctUntilChanged,
  filter,
  forkJoin,
  from,
  map,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  ActionType,
  CodeAction,
  CodeActionSettings,
  CodeExecutionResult,
} from '@activepieces/shared';
import { MatDialog } from '@angular/material/dialog';
import { TestCodeFormModalComponent } from '@activepieces/ui/feature-builder-form-controls';
import { Store } from '@ngrx/store';
import { TestStepCoreComponent } from '../test-steps-core.component';
import { TestStepService } from '@activepieces/ui/common';
import deepEqual from 'deep-equal';
@Component({
  selector: 'app-test-code-step',
  templateUrl: './test-code-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestCodeStepComponent extends TestStepCoreComponent {
  testing$: Subject<boolean> = new Subject();
  startTest$: Observable<void>;
  testDialogClosed$: Observable<void>;
  stepTest$: Observable<CodeExecutionResult>;
  lastTestResult$: Observable<unknown | undefined>;
  saveTestResult$: Observable<void>;
  saveStepAfterTesting$: Observable<void>;
  lastTestDate$: Observable<string | undefined>;
  constructor(
    private codeService: CodeService,
    private dialogService: MatDialog,
    store: Store,
    testStepService: TestStepService
  ) {
    super(testStepService, store);
    this.lastTestResult$ = this.store
      .select(BuilderSelectors.selectStepTestSampleData)
      .pipe(
        distinctUntilChanged((prev, current) => {
          return deepEqual(prev, current);
        })
      );
    this.lastTestDate$ = this.store
      .select(BuilderSelectors.selectLastTestDate)
      .pipe(
        distinctUntilChanged((prev, current) => {
          return prev === current;
        })
      );
  }

  testStep() {
    this.startTest$ = this.store
      .select(BuilderSelectors.selectCurrentStep)
      .pipe(
        take(1),
        tap((step) => {
          if (step?.type === ActionType.CODE) {
            const codeStepSettings = step.settings;
            const testData = codeStepSettings.input;
            const artifact$ = this.getArtifactObs$(codeStepSettings);
            this.testDialogClosed$ = this.dialogService
              .open(TestCodeFormModalComponent, {
                data: { testData: testData },
              })
              .afterClosed()
              .pipe(
                filter((res) => {
                  return !!res;
                }),
                tap((context) => {
                  this.testing$.next(true);
                  this.stepTest$ = forkJoin({
                    context: of(context),
                    artifact: artifact$,
                  }).pipe(
                    switchMap((res) => {
                      return this.codeService.executeTest(
                        res.artifact,
                        res.context
                      );
                    }),
                    tap((res) => {
                      this.testStepService.elevateResizer$.next(true);
                      this.saveTestResult(res);
                      this.testing$.next(false);
                    }),
                    shareReplay(1)
                  );
                })
              );
          }
        }),
        map(() => void 0)
      );
  }
  saveTestResult(result: CodeExecutionResult) {
    if (!result.standardError) {
      this.saveStepAfterTesting$ = this.store
        .select(BuilderSelectors.selectCurrentStep)
        .pipe(
          take(1),
          tap((step) => {
            if (step && step.type === ActionType.CODE) {
              const clone: CodeAction = {
                ...step,
                settings: {
                  ...step.settings,
                  inputUiInfo: {
                    currentSelectedData:
                      result.output === null || result.output === undefined
                        ? JSON.stringify(result.output)
                        : result.output,
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
          }),
          map(() => void 0)
        );
    }
  }
  getArtifactObs$(codeStepSettings: CodeActionSettings) {
    if (codeStepSettings.artifactSourceId) {
      return this.codeService.downloadAndReadFile(
        CodeService.constructFileUrl(codeStepSettings.artifactSourceId)
      );
    } else {
      return from(this.codeService.readFile(atob(codeStepSettings.artifact!)));
    }
  }
}
