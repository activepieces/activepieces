import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { InstanceRunService } from '@activepieces/ui/common';
import { FlowRun, Cursor } from '@activepieces/shared';
import {
  BehaviorSubject,
  Observable,
  map,
  mergeMap,
  scan,
  startWith,
  tap,
  throttleTime,
} from 'rxjs';
import {
  LeftSideBarType,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { Store } from '@ngrx/store';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

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
  constructor(
    private instanceRunService: InstanceRunService,
    private store: Store
  ) {}
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
    console.log('getBatch');
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
}
