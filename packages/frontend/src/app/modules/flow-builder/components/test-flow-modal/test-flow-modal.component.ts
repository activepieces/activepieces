import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { FlowService } from '../../../common/service/flow.service';
import {
  catchError,
  combineLatest,
  interval,
  map,
  Observable,
  of,
  switchMap,
  takeUntil,
  takeWhile,
  tap,
} from 'rxjs';
import { fadeInUp400ms } from '../../../common/animation/fade-in-up.animation';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../store/builder/builder.selector';
import { TestRunBarComponent } from '../../page/flow-builder/test-run-bar/test-run-bar.component';
import { FlowsActions } from '../../store/flow/flows.action';
import { InstanceRunService } from '../../../common/service/flow-run.service';
import { HttpStatusCode } from '@angular/common/http';
import { UntypedFormControl } from '@angular/forms';
import jsonlint from 'jsonlint-mod';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CodeService } from '../../service/code.service';
import {
  Collection,
  ExecutionOutputStatus,
  Flow,
  FlowRun,
  PieceTriggerSettings,
  TriggerType,
} from '@activepieces/shared';
import { ActionMetaService } from '../../service/action-meta.service';
import { jsonValidator } from '../../../common/validators/json-validator';
import { initializedRun } from '../../../common/model/flow-run.interface';

@Component({
  selector: 'app-test-flow-modal',
  templateUrl: './test-flow-modal.component.html',
  styleUrls: ['./test-flow-modal.component.scss'],
  animations: [fadeInUp400ms],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestFlowModalComponent implements OnInit {
  submitted = false;
  dialogRef: MatDialogRef<TemplateRef<unknown>>;
  instanceRunStatus$: Observable<undefined | ExecutionOutputStatus>;
  isSaving$: Observable<boolean> = of(false);
  selectedFlow$: Observable<Flow | undefined>;
  instanceRunStatusChecker$: Observable<FlowRun>;
  executeTest$: Observable<FlowRun | null>;
  selectedCollection$: Observable<Collection>;
  shouldDisableTestButton$: Observable<boolean>;
  testRunSnackbar: MatSnackBarRef<TestRunBarComponent>;
  testFlowButtonDisabledTooltip = '';
  payloadControl: UntypedFormControl = new UntypedFormControl(
    JSON.stringify(
      {
        body: {},
        headers: {},
      },
      null,
      2
    ),
    jsonValidator
  );
  codeEditorOptions = {
    lineNumbers: true,
    lineWrapping: true,
    theme: 'lucario',
    mode: 'application/ld+json',
    lint: true,
    gutters: ['CodeMirror-lint-markers'],
  };
  constructor(
    private flowService: FlowService,
    private store: Store,
    private instanceRunService: InstanceRunService,
    private snackbar: MatSnackBar,
    private dialogService: MatDialog,
    private codeService: CodeService,
    private cd: ChangeDetectorRef,
    private actionMetaDataService: ActionMetaService
  ) {
    (<any>window).jsonlint = jsonlint;
  }

  ngOnInit() {
    this.isSaving$ = this.store.select(BuilderSelectors.selectIsSaving);
    this.selectedCollection$ = this.store.select(
      BuilderSelectors.selectCurrentCollection
    );
    this.setupSelectedFlowListener();
    this.selectedInstanceRunStatus();
    this.shouldDisableTestButton$ = combineLatest({
      saving: this.isSaving$,
      valid: this.store.select(BuilderSelectors.selectCurrentFlowValidity),
    }).pipe(
      tap((res) => {
        if (res.saving) {
          this.testFlowButtonDisabledTooltip =
            'Please wait until saving is complete';
        } else if (!res.valid) {
          this.testFlowButtonDisabledTooltip =
            'Please make sure all flows are valid';
        } else {
          this.testFlowButtonDisabledTooltip = '';
        }
      }),
      map((res) => {
        return res.saving || !res.valid;
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

  testFlowButtonClicked(
    flow: Flow,
    collection: Collection,
    testFlowTemplate: TemplateRef<any>
  ) {
    this.submitted = true;
    if (flow.version!.trigger?.type === TriggerType.WEBHOOK) {
      this.dialogRef = this.dialogService.open(testFlowTemplate);
    } else if (flow.version!.trigger!.type === TriggerType.PIECE) {
      this.executeTest$ = this.actionMetaDataService.getPieces().pipe(
        map((pieces) => {
          return pieces.find(
            (p) =>
              p.name ===
              (flow.version?.trigger!.settings as PieceTriggerSettings)
                .pieceName
          )!;
        }),
        map((piece) => {
          return (
            piece.triggers[
              (flow.version?.trigger!.settings as PieceTriggerSettings)
                .triggerName
            ].sampleData || {}
          );
        }),
        switchMap((sampleData) =>
          this.executeTest(collection, flow, sampleData)
        )
      );
    } else {
      this.executeTest$ = this.executeTest(collection, flow, {});
    }
  }
  testFlowWithPayload(collection: Collection, flow: Flow) {
    if (this.payloadControl.valid) {
      this.dialogRef.close();
      this.executeTest$ = this.executeTest(
        collection,
        flow,
        JSON.parse(this.payloadControl.value)
      );
      this.cd.detectChanges();
    }
  }
  executeTest(collection: Collection, flow: Flow, payload: object) {
    return this.flowService
      .execute({
        collectionId: collection.id,
        flowVersionId: flow.version!.id,
        payload,
      })
      .pipe(
        tap({
          next: (instanceRun: FlowRun) => {
            this.testRunSnackbar = this.snackbar.openFromComponent(
              TestRunBarComponent,
              {
                duration: undefined,
                data: {
                  flowId: flow.id,
                },
              }
            );
            this.store.dispatch(
              FlowsActions.setRun({
                flowId: flow.id,
                run: instanceRun ?? initializedRun,
              })
            );
            this.setStatusChecker(flow.id, instanceRun.id);
          },
          error: (err) => {
            console.error(err);
          },
        }),
        catchError((err) => {
          console.error(err);
          if (err?.status == HttpStatusCode.PaymentRequired) {
            this.snackbar.open(
              'You reached the maximum runs number allowed. Contact support to discuss your plan.',
              '',
              {
                duration: 3000,
                panelClass: 'error',
              }
            );
          } else {
            this.snackbar.open(
              'Instance run failed, please check your console.',
              '',
              {
                panelClass: 'error',
              }
            );
          }
          this.store.dispatch(FlowsActions.exitRun({ flowId: flow.id }));
          return of(null);
        })
      );
  }
  setStatusChecker(flowId: string, runId: string) {
    this.instanceRunStatusChecker$ = interval(1500).pipe(
      takeUntil(this.testRunSnackbar.instance.exitButtonClicked),
      switchMap(() => this.instanceRunService.get(runId)),
      switchMap((instanceRun) => {
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
        if (
          instanceRun.status !== ExecutionOutputStatus.RUNNING &&
          instanceRun.logsFileId !== null
        ) {
          this.store.dispatch(
            FlowsActions.setRun({
              flowId: flowId,
              run: instanceRun,
            })
          );
        }
      }),
      takeWhile((instanceRun) => {
        return instanceRun.status === ExecutionOutputStatus.RUNNING;
      })
    );
  }

  public get triggerType() {
    return TriggerType;
  }

  public get statusEnum() {
    return ExecutionOutputStatus;
  }

  beautify() {
    try {
      const payload = this.payloadControl;
      payload.setValue(
        this.codeService.beautifyJson(JSON.parse(payload.value))
      );
    } catch {
      //ignore
    }
  }
}
