import { Component, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, shareReplay, startWith, Subject, tap } from 'rxjs';
import { FlowsTableDataSource } from './flows-table.datasource';
import { MatDialog } from '@angular/material/dialog';
import {
  PopulatedFlow,
  FlowStatus,
  FolderId,
  TriggerType,
  FlowOperationType,
} from '@activepieces/shared';

import {
  ApPaginatorComponent,
  AuthenticationService,
  FoldersService,
  NavigationService,
  flowActionsUiInfo,
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

@Component({
  templateUrl: './flows-table.component.html',
})
export class FlowsTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  readonly flowActionsUiInfo = flowActionsUiInfo;
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
    private store: Store,
    private authenticationService: AuthenticationService,
    private navigationService: NavigationService,
    @Inject(LOCALE_ID) public locale: string
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
      this.authenticationService,
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

  openBuilder(flow: PopulatedFlow, event: MouseEvent) {
    const link = '/flows/' + flow.id;
    const newWindow = event.ctrlKey || event.which == 2 || event.button == 4;
    this.navigationService.navigate(link, newWindow);
  }

  deleteFlow(flow: PopulatedFlow) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.flowService.delete(flow.id),
      entityName: flow.version.displayName,
      note: flowActionsUiInfo.delete.note,
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
  toggleFlowStatus(flow: PopulatedFlow, control: FormControl<boolean>) {
    if (control.enabled) {
      control.disable();
      this.flowsUpdateStatusRequest$[flow.id] = this.flowService
        .update(flow.id, {
          type: FlowOperationType.CHANGE_STATUS,
          request: {
            status:
              flow.status === FlowStatus.ENABLED
                ? FlowStatus.DISABLED
                : FlowStatus.ENABLED,
          },
        })
        .pipe(
          tap((res) => {
            control.enable();
            control.setValue(res.status === FlowStatus.ENABLED);
            this.flowsUpdateStatusRequest$[flow.id] = null;
            flow.status = res.status;
          }),
          map(() => void 0)
        );
    }
  }
  duplicate(flow: PopulatedFlow) {
    this.duplicateFlow$ = this.flowService.duplicate(flow.id);
  }

  moveFlow(flow: PopulatedFlow) {
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
}
