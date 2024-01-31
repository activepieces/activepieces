import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FlowService, InstanceRunService } from '@activepieces/ui/common';
import { FlowRun, Cursor, PopulatedFlow } from '@activepieces/shared';
import {
  BehaviorSubject,
  Observable,
  forkJoin,
  map,
  mergeMap,
  scan,
  startWith,
  tap,
  throttleTime,
} from 'rxjs';
import {
  BuilderSelectors,
  LeftSideBarType,
  TestRunBarComponent,
  ViewModeActions,
  ViewModeEnum,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { Store } from '@ngrx/store';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-runs-list',
  templateUrl: './runs-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunsListComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport)
  viewport: CdkVirtualScrollViewport;
  @Input({
    required: true,
  })
  projectId!: string;
  @Input({
    required: true,
  })
  flowId!: string;
  runs$!: Observable<FlowRun[]>;
  cursor: Cursor = null;
  offset$ = new BehaviorSubject<Cursor>(null);
  showRun$?: Observable<{ flow: PopulatedFlow; run: FlowRun }>;
  currentRun$: Observable<FlowRun | undefined>;
  isInDebugMode$: Observable<boolean>;
  constructor(
    private instanceRunService: InstanceRunService,
    private store: Store,
    private flowService: FlowService,
    private snackbar: MatSnackBar
  ) {
    this.currentRun$ = this.store.select(BuilderSelectors.selectCurrentFlowRun);
    this.isInDebugMode$ = this.store.select(
      BuilderSelectors.selectIsInDebugMode
    );
  }
  ngOnInit(): void {
    this.runs$ = this.offset$.pipe(
      startWith(null),
      tap(console.log),
      throttleTime(500),
      mergeMap(() => this.getBatch(this.cursor, this.flowId, this.projectId)),
      scan((acc, batch) => {
        return [...acc, ...batch];
      }, [] as FlowRun[])
    );
  }
  closeLeftSideBar() {
    this.store.dispatch(
      canvasActions.setLeftSidebar({
        sidebarType: LeftSideBarType.NONE,
      })
    );
  }
  nextBatch() {
    if (this.cursor === null) {
      return;
    }

    const end = this.viewport.getRenderedRange().end;
    const total = this.viewport.getDataLength();
    if (end === total) {
      this.offset$.next(this.cursor);
    }
  }
  getBatch(cursor: Cursor, flowId: string, projectId: string) {
    return this.instanceRunService
      .list(projectId, {
        flowId: flowId,
        cursor: cursor || '',
        limit: 30,
      })
      .pipe(
        tap((res) => {
          this.cursor = res.next;
        }),
        map((res) => res.data)
      );
  }
  ShowRun(run: FlowRun) {
    const run$ = this.instanceRunService.get(run.id);
    const flow$ = this.flowService.get(this.flowId, run.flowVersionId);
    this.showRun$ = forkJoin({
      run: run$,
      flow: flow$,
    }).pipe(
      tap((res) => {
        this.store.dispatch(
          canvasActions.viewRun({
            run: res.run,
            version: res.flow.version,
          })
        );
        this.snackbar.openFromComponent(TestRunBarComponent, {
          duration: undefined,
        });
      })
    );
  }
  exitRun() {
    this.store.dispatch(
      ViewModeActions.setViewMode({ viewMode: ViewModeEnum.BUILDING })
    );
  }
}
