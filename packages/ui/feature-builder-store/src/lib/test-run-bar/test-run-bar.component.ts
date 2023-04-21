import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of, tap } from 'rxjs';
import {
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA,
} from '@angular/material/snack-bar';
import { ExecutionOutputStatus, FlowId, FlowRun } from '@activepieces/shared';
import { BuilderSelectors } from '../store/builder/builder.selector';
import { FlowsActions } from '../store/flow/flows.action';

@Component({
  selector: 'app-test-run-bar',
  templateUrl: './test-run-bar.component.html',
  styleUrls: ['./test-run-bar.component.scss'],
})
export class TestRunBarComponent implements OnInit {
  constructor(
    private snackbarRef: MatSnackBarRef<TestRunBarComponent>,
    private store: Store,
    @Inject(MAT_SNACK_BAR_DATA) public data: { flowId: FlowId }
  ) {}
  hideExit$: Observable<boolean> = of(false);
  selectedRun$: Observable<FlowRun | undefined | null>;
  exitRun$: Observable<void> = new Observable<void>();
  @Output()
  exitButtonClicked: EventEmitter<void> = new EventEmitter();

  ngOnInit(): void {
    this.hideExit$ = this.store.select(BuilderSelectors.selectIsInDebugMode);
    this.selectedRun$ = this.store.select(
      BuilderSelectors.selectCurrentFlowRun
    );
    this.exitRun$ = this.exitButtonClicked.pipe(
      tap(() => {
        this.snackbarRef.dismiss();
        //wait for animation to be done
        setTimeout(() => {
          this.store.dispatch(
            FlowsActions.exitRun({ flowId: this.data.flowId })
          );
        }, 150);
      })
    );
  }

  get instanceRunStatus() {
    return ExecutionOutputStatus;
  }
}
