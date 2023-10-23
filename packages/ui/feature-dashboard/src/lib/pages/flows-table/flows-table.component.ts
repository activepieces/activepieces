import { Component, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable, shareReplay, startWith, Subject, tap } from 'rxjs';
import { FlowsTableDataSource } from './flows-table.datasource';
import { MatDialog } from '@angular/material/dialog';
import {
  Flow,
  FlowInstanceStatus,
  FolderId,
  TriggerType,
} from '@activepieces/shared';

import {
  ApPaginatorComponent,
  FlowInstanceService,
  FoldersService,
} from '@activepieces/ui/common';
import { FlowService } from '@activepieces/ui/common';
import { ARE_THERE_FLOWS_FLAG } from '../../resolvers/are-there-flows.resolver';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
} from '@activepieces/ui/common';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { FolderActions } from '../../store/folders/folders.actions';
import {
  MoveFlowToFolderDialogComponent,
  MoveFlowToFolderDialogData,
} from './move-flow-to-folder-dialog/move-flow-to-folder-dialog.component';
import { FoldersSelectors } from '../../store/folders/folders.selector';
import cronstrue from 'cronstrue/i18n';

@Component({
  templateUrl: './flows-table.component.html',
})
export class FlowsTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  creatingFlow = false;
  deleteFlowDialogClosed$: Observable<void>;
  moveFlowDialogClosed$: Observable<void>;
  dataSource!: FlowsTableDataSource;
  folderId$: Observable<FolderId | undefined>;
  displayedColumns = [
    'name',
    'steps',
    'folderName',
    'created',
    'status',
    'action',
  ];
  refreshTableAtCurrentCursor$: Subject<boolean> = new Subject();
  areThereFlows$: Observable<boolean>;
  flowsUpdateStatusRequest$: Record<string, Observable<void> | null> = {};
  showAllFlows$: Observable<boolean>;
  duplicateFlow$: Observable<void>;
  constructor(
    private activatedRoute: ActivatedRoute,
    private dialogService: MatDialog,
    private flowService: FlowService,
    private foldersService: FoldersService,
    private router: Router,
    private instanceService: FlowInstanceService,
    private store: Store,
    @Inject(LOCALE_ID) private locale: string
  ) {
    this.listenToShowAllFolders();
    this.folderId$ = this.store.select(FoldersSelectors.selectCurrentFolderId);
  }

  private listenToShowAllFolders() {
    this.showAllFlows$ = this.store
      .select(FoldersSelectors.selectDisplayAllFlows)
      .pipe(
        tap((displayAllFlows) => {
          this.hideOrShowFolderColumn(displayAllFlows);
        }),
        shareReplay(1)
      );
  }

  private hideOrShowFolderColumn(displayAllFlows: boolean) {
    const folderColumnIndex = this.displayedColumns.findIndex(
      (c) => c === 'folderName'
    );
    if (displayAllFlows && folderColumnIndex == -1) {
      this.displayedColumns.splice(2, 0, 'folderName');
    } else if (!displayAllFlows && folderColumnIndex !== -1) {
      this.displayedColumns.splice(folderColumnIndex, 1);
    }
  }

  ngOnInit(): void {
    this.dataSource = new FlowsTableDataSource(
      this.activatedRoute.queryParams,
      this.foldersService,
      this.paginator,
      this.flowService,
      this.refreshTableAtCurrentCursor$.asObservable().pipe(startWith(true)),
      this.store
    );
    this.areThereFlows$ = this.activatedRoute.data.pipe(
      map((res) => {
        return res[ARE_THERE_FLOWS_FLAG];
      })
    );
  }

  openBuilder(flow: Flow, event: MouseEvent) {
    const link = '/flows/' + flow.id;
    if (event.ctrlKey || event.which == 2 || event.button == 4) {
      // Open in new tab
      window.open(link, '_blank', 'noopener');
    } else {
      // Open in the same tab
      this.router.navigateByUrl(link);
    }
  }

  deleteFlow(flow: Flow) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.flowService.delete(flow.id),
      entityName: flow.version.displayName,
      note: $localize`This will permanently delete the flow, all its data and any background runs.
      You can't undo this action.`,
    };
    const dialogRef = this.dialogService.open(DeleteEntityDialogComponent, {
      data: dialogData,
    });
    this.deleteFlowDialogClosed$ = dialogRef.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.refreshTableAtCurrentCursor$.next(true);
          this.store.dispatch(
            FolderActions.deleteFlow({
              flowDisplayName: flow.version.displayName,
            })
          );
        }
      }),
      map(() => {
        return void 0;
      })
    );
  }
  toggleFlowStatus(flow: Flow, control: FormControl<boolean>) {
    if (control.enabled) {
      control.disable();
      this.flowsUpdateStatusRequest$[flow.id] = this.instanceService
        .updateStatus(flow.id, {
          status:
            flow.status === FlowInstanceStatus.ENABLED
              ? FlowInstanceStatus.DISABLED
              : FlowInstanceStatus.ENABLED,
        })
        .pipe(
          tap((res) => {
            control.enable();
            control.setValue(res.status === FlowInstanceStatus.ENABLED);
            this.flowsUpdateStatusRequest$[flow.id] = null;
            flow.status = res.status;
          }),
          map(() => void 0)
        );
    }
  }
  duplicate(flow: Flow) {
    this.duplicateFlow$ = this.flowService.duplicate(flow.id);
  }

  getTriggerIcon(flow: Flow) {
    const trigger = flow.version.trigger;
    switch (trigger.type) {
      case TriggerType.WEBHOOK:
        return 'assets/img/custom/triggers/instant-filled.svg';
      case TriggerType.PIECE: {
        const cronExpression = flow.schedule?.cronExpression;
        if (cronExpression) {
          return 'assets/img/custom/triggers/periodic-filled.svg';
        } else {
          return 'assets/img/custom/triggers/instant-filled.svg';
        }
      }
      case TriggerType.EMPTY: {
        console.error(
          "Flow can't be published with empty trigger " +
            flow.version.displayName
        );
        return 'assets/img/custom/warn.svg';
      }
    }
  }

  getTriggerToolTip(flow: Flow) {
    const trigger = flow.version.trigger;
    switch (trigger.type) {
      case TriggerType.WEBHOOK:
        return $localize`Real time flow`;
      case TriggerType.PIECE: {
        const cronExpression = flow.schedule?.cronExpression;
        return cronExpression
          ? $localize`Runs ${cronstrue
              .toString(cronExpression, { locale: this.locale })
              .toLocaleLowerCase()}`
          : $localize`Real time flow`;
      }
      case TriggerType.EMPTY: {
        console.error(
          "Flow can't be published with empty trigger " +
            flow.version.displayName
        );
        return $localize`Please contact support as your published flow has a problem`;
      }
    }
  }

  moveFlow(flow: Flow) {
    const dialogData: MoveFlowToFolderDialogData = {
      flowId: flow.id,
      folderId: flow.folderId,
    };
    this.moveFlowDialogClosed$ = this.dialogService
      .open(MoveFlowToFolderDialogComponent, { data: dialogData })
      .afterClosed()
      .pipe(
        tap((val: boolean) => {
          if (val) {
            this.refreshTableAtCurrentCursor$.next(true);
          }
        }),
        map(() => void 0)
      );
  }

  getStatusFlowMatTooltip(flow: any) {
    if (flow.instanceToggleControl.disabled) {
      return $localize`Please publish the flow`;
    }

    return flow.instanceToggleControl.value
      ? $localize`Flow is on`
      : $localize`Flow is off`;
  }
}
