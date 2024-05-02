import { Component, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { FlowsTableDataSource } from './flows-table.datasource';
import { MatDialog } from '@angular/material/dialog';
import {
  PopulatedFlow,
  FlowStatus,
  FolderId,
  FlowOperationType,
  TelemetryEventName,
  ApFlagId,
  isNil,
} from '@activepieces/shared';
import {
  ApPaginatorComponent,
  AuthenticationService,
  EmbeddingService,
  FlagService,
  FoldersService,
  NavigationService,
  TelemetryService,
  downloadFlow,
  flowActionsUiInfo,
  flowDeleteNote,
  flowDeleteNoteWithGit,
} from '@activepieces/ui/common';
import { FlowService } from '@activepieces/ui/common';
import { ARE_THERE_FLOWS_FLAG } from '../../resolvers/are-there-flows.resolver';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
} from '@activepieces/ui/common';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  FolderActions,
  FoldersSelectors,
  MoveFlowToFolderDialogComponent,
  MoveFlowToFolderDialogData,
} from '@activepieces/ui/feature-folders-store';
import {
  RenameFlowDialogComponent,
  RenameFlowDialogData,
} from '../../components/dialogs/rename-flow-dialog/rename-flow-dialog.component';
import { RewardsDialogComponent } from '../../components/dialogs/rewards-dialog/rewards-dialog.component';
import { SyncProjectService } from '@activepieces/ui-feature-git-sync';
import { GitBranchType, GitPushOperationType } from '@activepieces/ee-shared';

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
  areThereFlows$?: Observable<boolean>;
  flowsUpdateStatusRequest$: Record<string, Observable<void> | null> = {};
  showAllFlows$: Observable<boolean>;
  duplicateFlow$?: Observable<void>;
  downloadTemplate$?: Observable<void>;
  renameFlow$?: Observable<boolean>;
  hideFolders$ = this.embeddingService.getHideFolders$();
  showRewards$: Observable<boolean>;
  deleteFlowFromGit$?: Observable<void>;
  constructor(
    private activatedRoute: ActivatedRoute,
    private dialogService: MatDialog,
    private flowService: FlowService,
    private foldersService: FoldersService,
    private store: Store,
    private authenticationService: AuthenticationService,
    private navigationService: NavigationService,
    private embeddingService: EmbeddingService,
    private telemetryService: TelemetryService,
    private flagService: FlagService,
    private syncProjectService: SyncProjectService,
    @Inject(LOCALE_ID) public locale: string
  ) {
    this.showAllFlows$ = this.listenToShowAllFolders();
    this.folderId$ = this.store.select(FoldersSelectors.selectCurrentFolderId);
    this.showRewards$ = this.flagService.isFlagEnabled(ApFlagId.SHOW_REWARDS);
  }

  private listenToShowAllFolders() {
    return this.store.select(FoldersSelectors.selectDisplayAllFlows).pipe(
      switchMap((displayAllFlows) => {
        return this.hideFolders$.pipe(
          map((hideFoldersList) => {
            return displayAllFlows && !hideFoldersList;
          })
        );
      }),
      tap((showFoldersColumn) => {
        this.toggleFoldersColumn(showFoldersColumn);
      }),
      shareReplay(1)
    );
  }

  private toggleFoldersColumn(showFoldersColumn: boolean) {
    const folderColumnIndex = this.displayedColumns.findIndex(
      (c) => c === 'folderName'
    );
    if (showFoldersColumn && folderColumnIndex == -1) {
      this.displayedColumns.splice(2, 0, 'folderName');
    } else if (!showFoldersColumn && folderColumnIndex !== -1) {
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
    const route = ['/flows/' + flow.id];
    const openInNewWindow =
      event.ctrlKey || event.which == 2 || event.button == 4;
    this.navigationService.navigate({
      route,
      openInNewWindow,
    });
  }

  deleteFlow(flow: PopulatedFlow) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.flowService.delete(flow.id),
      entityName: flow.version.displayName,
      note: '',
      note$: this.syncProjectService.isDevelopment().pipe(
        map((isDevelopment) => {
          return isDevelopment ? flowDeleteNoteWithGit : flowDeleteNote;
        })
      ),
    };
    const dialogRef = this.dialogService.open(DeleteEntityDialogComponent, {
      data: dialogData,
    });
    this.deleteFlowDialogClosed$ = dialogRef.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.deleteFlowFromGit$ = this.syncProjectService.get().pipe(
            switchMap((repo) => {
              if (
                isNil(repo) ||
                repo.branchType !== GitBranchType.DEVELOPMENT
              ) {
                return of(undefined);
              }
              return this.syncProjectService.push(repo.id, {
                type: GitPushOperationType.DELETE_FLOW,
                flowId: flow.id,
                commitMessage: `chore: deleted flow ${flow.version.displayName}`,
              });
            }),
            map(() => void 0)
          );

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
  export(flow: PopulatedFlow) {
    this.downloadTemplate$ = this.flowService
      .exportTemplate(flow.id, undefined)
      .pipe(
        tap(downloadFlow),
        map(() => {
          return void 0;
        })
      );
  }
  moveFlow(flow: PopulatedFlow) {
    const data: MoveFlowToFolderDialogData = {
      flowId: flow.id,
      folderId: flow.folderId,
      flowDisplayName: flow.version.displayName,
      inBuilder: false,
    };
    this.moveFlowDialogClosed$ = this.dialogService
      .open(MoveFlowToFolderDialogComponent, { data })
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
  renameFlow(flow: PopulatedFlow) {
    const data: RenameFlowDialogData = { flow };
    this.renameFlow$ = this.dialogService
      .open(RenameFlowDialogComponent, { data })
      .afterClosed()
      .pipe(
        tap((res) => {
          if (res) {
            this.refreshTableAtCurrentCursor$.next(true);
          }
        })
      );
  }
  openRewardsDialog() {
    this.dialogService.open(RewardsDialogComponent);
    this.telemetryService.capture({
      name: TelemetryEventName.REWARDS_OPENED,
      payload: {
        source: 'rewards-button',
      },
    });
  }
}
