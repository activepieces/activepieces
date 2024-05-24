import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, map, of, switchMap, tap } from 'rxjs';
import {
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA,
} from '@angular/material/snack-bar';
import { FlowRunStatus, FlowId, FlowRun } from '@activepieces/shared';
import { BuilderSelectors } from '../store/builder/builder.selector';
import { FlagService } from '@activepieces/ui/common';
import { canvasActions } from '../store/builder/canvas/canvas.action';

@Component({
  selector: 'app-test-run-bar',
  templateUrl: './test-run-bar.component.html',
})
export class TestRunBarComponent implements OnInit {
  constructor(
    private snackbarRef: MatSnackBarRef<TestRunBarComponent>,
    private flagsService: FlagService,
    private store: Store,
    @Inject(MAT_SNACK_BAR_DATA) public data: { flowId: FlowId }
  ) {}
  hideExit$: Observable<boolean> = of(false);
  selectedRun$: Observable<FlowRun | undefined | null>;
  sandboxTimeoutSeconds$: Observable<number>;
  exitRun$: Observable<void> = new Observable<void>();
  @Output()
  exitButtonClicked: EventEmitter<void> = new EventEmitter();
  readonly FlowRunStatus = FlowRunStatus;
  ngOnInit(): void {
    this.hideExit$ = this.store.select(BuilderSelectors.selectIsInDebugMode);
    this.selectedRun$ = this.store
      .select(BuilderSelectors.selectCurrentFlowRun)
      .pipe(
        tap((run) => {
          if (!run) {
            this.snackbarRef.dismiss();
          }
        })
      );
    this.sandboxTimeoutSeconds$ = this.flagsService.getSandboxTimeout();
    this.exitRun$ = this.exitButtonClicked.pipe(
      switchMap(() => this.store.select(BuilderSelectors.selectDraftVersion)),
      tap((draftVersion) => {
        this.snackbarRef.dismiss();
        //wait for animation to be done
        setTimeout(() => {
          this.store.dispatch(
            canvasActions.exitRun({
              flowVersion: draftVersion,
            })
          );
        }, 150);
      }),
      map(() => void 0)
    );
  }
}
