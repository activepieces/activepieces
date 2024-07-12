import { Component, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  combineLatest,
  distinctUntilChanged,
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
  Permission,
} from '@activepieces/shared';
import {
  ApPaginatorComponent,
  AuthenticationService,
  EmbeddingService,
  FLOW_NAME_QUERY_PARAM,
  FLOW_STATUS_QUERY_PARAM,
  FilterConfig,
  FlagService,
  FoldersService,
  NavigationService,
  TableCore,
  TelemetryService,
  flowActionsUiInfo,
} from '@activepieces/ui/common';
import { FlowService } from '@activepieces/ui/common';
import { ARE_THERE_FLOWS_FLAG } from '../../resolvers/are-there-flows.resolver';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { FoldersSelectors } from '@activepieces/ui/feature-folders-store';
import { RewardsDialogComponent } from '../../components/dialogs/rewards-dialog/rewards-dialog.component';
import {
  RenameFlowDialogComponent,
  RenameFlowDialogData,
} from '../../components/dialogs/rename-flow-dialog/rename-flow-dialog.component';

@Component({
  templateUrl: './flows-table.component.html',
})
export class FlowsTableComponent extends TableCore implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  readonly flowActionsUiInfo = flowActionsUiInfo;
  creatingFlow = false;
  dataSource!: FlowsTableDataSource;
  folderId$: Observable<FolderId | undefined>;
  refreshTableAtCurrentCursor$: Subject<boolean> = new Subject();
  areThereFlows$?: Observable<boolean>;
  flowsUpdateStatusRequest$: Record<string, Observable<void> | null> = {};
  showAllFlows$: Observable<boolean>;
  hideFolders$ = this.embeddingService.getHideFolders$();
  showRewards$: Observable<boolean>;
  isStatusReadOnly = !this.hasPermission(Permission.UPDATE_FLOW_STATUS);
  renameFlow$?: Observable<unknown>;
  filtersChanged$: Observable<void>;
  flowNameFilterControl: FormControl<string | null> = new FormControl(null);
  flowStatusFilterControl: FormControl<string | null> = new FormControl(null);
  filters: FilterConfig<
    {
      label: string;
      value: string;
    },
    string
  >[];
  constructor(
    private router: Router,
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
    @Inject(LOCALE_ID) public locale: string
  ) {
    super({
      tableColumns: [
        'name',
        'steps',
        'folderName',
        'created',
        'status',
        'action',
      ],
    });
    this.showAllFlows$ = this.listenToShowAllFolders();
    this.folderId$ = this.store.select(FoldersSelectors.selectCurrentFolderId);
    this.showRewards$ = this.flagService.isFlagEnabled(ApFlagId.SHOW_REWARDS);
    this.flowNameFilterControl.setValue(
      this.activatedRoute.snapshot.queryParamMap.get(FLOW_NAME_QUERY_PARAM)
    );
    this.flowStatusFilterControl.setValue(
      this.activatedRoute.snapshot.queryParamMap.get(FLOW_STATUS_QUERY_PARAM)
    );
    this.filters = [
      {
        type: 'text',
        name: 'By Name',
        label: 'Filter By Name',
        formControl: this.flowNameFilterControl,
        queryParam: FLOW_NAME_QUERY_PARAM,
      },
      {
        type: 'select',
        name: 'By Status',
        label: 'Filter By Status',
        formControl: this.flowStatusFilterControl,
        queryParam: FLOW_STATUS_QUERY_PARAM,
        options$: of([
          { label: 'Enabled', value: FlowStatus.ENABLED },
          { label: 'Disabled', value: FlowStatus.DISABLED },
        ]),
        allValues$: of([FlowStatus.ENABLED, FlowStatus.DISABLED]),
        optionLabelKey: 'label',
        optionValueKey: 'value',
      },
    ];
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
    this.filtersChanged$ = combineLatest({
      flowName: this.flowNameFilterControl.valueChanges.pipe(
        startWith(this.flowNameFilterControl.value)
      ),
      flowStatus: this.flowStatusFilterControl.valueChanges.pipe(
        startWith(this.flowStatusFilterControl.value)
      ),
    }).pipe(
      distinctUntilChanged(),
      tap((result) => {
        this.router.navigate(['flows'], {
          queryParams: {
            name: result.flowName,
            status: result.flowStatus,
          },
          queryParamsHandling: 'merge',
        });
      }),
      map(() => undefined)
    );

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
  refreshTable() {
    this.refreshTableAtCurrentCursor$.next(true);
  }
}
