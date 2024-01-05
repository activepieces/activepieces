import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  catchError,
  combineLatest,
  interval,
  map,
  Observable,
  of,
  takeUntil,
  takeWhile,
  tap,
} from 'rxjs';
import {
  FlowService,
  InstanceRunService,
  fadeIn400msWithoutOut,
  initializedRun,
} from '@activepieces/ui/common';
import { Store } from '@ngrx/store';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import {
  ExecutionOutputStatus,
  FlowRun,
  PopulatedFlow,
  TriggerType,
} from '@activepieces/shared';
import {
  BuilderSelectors,
  TestRunBarComponent,
} from '@activepieces/ui/feature-builder-store';
import { concatMap } from 'rxjs/operators';
import { canvasActions } from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-test-flow-widget',
  templateUrl: './test-flow-widget.component.html',
  styleUrls: ['./test-flow-widget.component.scss'],
  animations: [fadeIn400msWithoutOut],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestFlowWidgetComponent implements OnInit {
  triggerType = TriggerType;
  statusEnum = ExecutionOutputStatus;
  instanceRunStatus$: Observable<undefined | ExecutionOutputStatus>;
  isSaving$: Observable<boolean> = of(false);
  selectedFlow$: Observable<PopulatedFlow | undefined>;
  instanceRunStatusChecker$: Observable<FlowRun>;
  executeTest$: Observable<FlowRun | null>;
  shouldHideTestWidget$: Observable<boolean>;
  testRunSnackbar: MatSnackBarRef<TestRunBarComponent>;
  isTriggerTested$: Observable<boolean>;
  readonly testFlowText = $localize`Test flow`;
  readonly savingText = $localize`Saving...`;
  constructor(
    private flowService: FlowService,
    private store: Store,
    private instanceRunService: InstanceRunService,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isTriggerTested$ = this.store.select(
      BuilderSelectors.selectFlowTriggerIsTested
    );
    this.store.select(BuilderSelectors.selectIsSaving);
    this.setupSelectedFlowListener();
    this.selectedInstanceRunStatus();
    this.shouldHideTestWidget$ = combineLatest({
      saving: this.isSaving$,
      valid: this.store.select(BuilderSelectors.selectCurrentFlowValidity),
      isInReadOnlyMode: this.store.select(BuilderSelectors.selectReadOnly),
    }).pipe(
      map((res) => {
        return !res.valid || res.isInReadOnlyMode;
      })
    );
  }

  private setupSelectedFlowListener() {
    this.selectedFlow$ = this.store.select(BuilderSelectors.selectCurrentFlow);
  }

  selectedInstanceRunStatus() {
    this.instanceRunStatus$ = this.store.select(
      BuilderSelectors.selectCurrentFlowRunStatus
    );
  }

  testFlowButtonClicked(flow: PopulatedFlow) {
    this.executeTest$ = this.executeTest(flow);
  }

  executeTest(flow: PopulatedFlow) {
    return this.flowService
      .execute({
        flowVersionId: flow.version.id,
      })
      .pipe(
        tap({
          next: (instanceRun: FlowRun) => {
            this.store.dispatch(
              canvasActions.setRun({
                run: instanceRun ?? initializedRun,
              })
            );
            this.testRunSnackbar = this.snackbar.openFromComponent(
              TestRunBarComponent,
              {
                duration: undefined,
                data: {
                  flowId: flow.id,
                },
              }
            );
            this.setStatusChecker(instanceRun.id);
          },
          error: (err) => {
            console.error(err);
          },
        }),
        catchError((err) => {
          console.error(err);
          this.snackbar.open(
            'Instance run failed, please check your console.',
            '',
            {
              panelClass: 'error',
            }
          );
          this.store.dispatch(canvasActions.exitRun());
          return of(null);
        })
      );
  }
  setStatusChecker(runId: string) {
    this.instanceRunStatusChecker$ = interval(1500).pipe(
      takeUntil(this.testRunSnackbar.instance.exitButtonClicked),
      concatMap(() => this.instanceRunService.get(runId)),
      concatMap((instanceRun) => {
        if (
          instanceRun.status !== ExecutionOutputStatus.RUNNING &&
          instanceRun.logsFileId !== null
        ) {
          return this.flowService.loadStateLogs(instanceRun.logsFileId).pipe(
            map((state) => {
              return { ...instanceRun, state: state };
            })
          );
        }
        return of(instanceRun);
      }),
      tap((instanceRun) => {
        if (instanceRun.status !== ExecutionOutputStatus.RUNNING) {
          this.store.dispatch(
            canvasActions.setRun({
              run: instanceRun,
            })
          );
        }
      }),
      takeWhile((instanceRun) => {
        return (
          instanceRun.status === ExecutionOutputStatus.RUNNING ||
          instanceRun.status === ExecutionOutputStatus.PAUSED
        );
      })
    );
  }
}
