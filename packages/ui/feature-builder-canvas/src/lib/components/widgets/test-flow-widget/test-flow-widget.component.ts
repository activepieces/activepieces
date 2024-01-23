import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { combineLatest, map, Observable, of, tap } from 'rxjs';
import {
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
import { switchMap } from 'rxjs/operators';
import { canvasActions } from '@activepieces/ui/feature-builder-store';
import { Socket } from 'ngx-socket-io';

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
  testResult$: Observable<FlowRun>;
  shouldHideTestWidget$: Observable<boolean>;
  testRunSnackbar: MatSnackBarRef<TestRunBarComponent>;
  isTriggerTested$: Observable<boolean>;
  readonly testFlowText = $localize`Test flow`;
  readonly savingText = $localize`Saving...`;
  constructor(
    private store: Store,
    private instanceRunService: InstanceRunService,
    private snackbar: MatSnackBar,
    private socket: Socket
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
    this.executeTest(flow);
  }

  executeTest(flow: PopulatedFlow) {
    this.socket.emit('testFlowRun', {
      flowVersionId: flow.version.id,
      projectId: flow.projectId,
    });

    this.executeTest$ = this.socket.fromEvent<FlowRun>('flowRunStarted').pipe(
      tap((flowRun) => {
        this.socket.emit('join', flowRun.id);
        this.store.dispatch(
          canvasActions.setRun({
            run: flowRun ?? initializedRun,
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
      })
    );

    this.testResult$ = this.socket.fromEvent<FlowRun>('flowRunFinished').pipe(
      switchMap((flowRun) =>
        this.instanceRunService.get((flowRun as FlowRun).id)
      ),
      tap((instanceRun) => {
        this.store.dispatch(canvasActions.setRun({ run: instanceRun }));
        this.socket.emit('leave', instanceRun.id);
      })
    );
  }
}
