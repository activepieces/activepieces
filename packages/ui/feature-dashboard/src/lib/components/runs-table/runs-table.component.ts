import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FlowRunStatus,
  FlowRetryStrategy,
  FlowRun,
  ProjectId,
  SeekPage,
  spreadIfDefined,
  Permission,
  FlowVersion,
} from '@activepieces/shared';
import { ActivatedRoute } from '@angular/router';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  Subject,
  tap,
} from 'rxjs';
import { RunsTableDataSource } from './runs-table.datasource';
import {
  InstanceRunService,
  ApPaginatorComponent,
  NavigationService,
  AuthenticationService,
  FlowService,
  FLOW_QUERY_PARAM,
  STATUS_QUERY_PARAM,
  DATE_RANGE_END_QUERY_PARAM,
  DATE_RANGE_START_QUERY_PARAM,
  ProjectService,
  UiCommonModule,
  ApDatePipe,
  LIMIT_QUERY_PARAM,
  CURSOR_QUERY_PARAM,
  executionsPageFragments,
  EmbeddingService,
  TableCore,
  FilterConfig,
} from '@activepieces/ui/common';
import { FormControl, FormGroup } from '@angular/forms';
import { RunsService } from '../../services/runs.service';
import { CommonModule } from '@angular/common';
import dayjs from 'dayjs';
import { ApFilterComponent } from '@activepieces/ui/common';
const allOptionValue = 'all';
@Component({
  templateUrl: './runs-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, UiCommonModule, ApDatePipe, ApFilterComponent],
  selector: 'app-runs-table',
})
export class RunsTableComponent extends TableCore implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  readonly allOptionValue = allOptionValue;
  runsPage$: Observable<SeekPage<FlowRun>>;
  searchControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  dataSource!: RunsTableDataSource;
  refreshTableForReruns$: Subject<boolean> = new Subject();
  statusFilterControl: FormControl<FlowRunStatus[]> = new FormControl([], {
    nonNullable: true,
  });
  flowFilterControl = new FormControl<string>('');
  flowFilterSearchControl = new FormControl<string>('', {
    nonNullable: true,
  });
  dateFormGroup = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });
  selectedFlowName$: Observable<string | undefined>;
  allFlows: BehaviorSubject<string[] | undefined> = new BehaviorSubject<
    string[] | undefined
  >(undefined);
  flows$: Observable<FlowVersion[]>;
  currentProject: ProjectId;
  filtersChanged$: Observable<void>;
  readonly ExecutionOutputStatus = FlowRunStatus;
  FlowRetryStrategy: typeof FlowRetryStrategy = FlowRetryStrategy;
  retryFlow$?: Observable<void>;
  setInitialFilters$?: Observable<void>;
  allStatuses = Object.values(FlowRunStatus);
  hasPermissionToRetryFlow = this.hasPermission(Permission.RETRY_RUN);
  filters: FilterConfig<
    FlowVersion | { label: string; value: FlowRunStatus },
    string
  >[];
  constructor(
    private activatedRoute: ActivatedRoute,
    private projectService: ProjectService,
    private instanceRunService: InstanceRunService,
    private navigationService: NavigationService,
    private runsService: RunsService,
    private flowsService: FlowService,
    private authenticationService: AuthenticationService,
    private embeddingService: EmbeddingService
  ) {
    super({
      tableColumns: ['flowName', 'status', 'started', 'duration', 'action'],
    });
    this.currentProject = this.authenticationService.getProjectId();
    this.flowFilterControl.setValue(
      this.activatedRoute.snapshot.queryParamMap.get(FLOW_QUERY_PARAM)
    );
    const statusQueryParam =
      this.activatedRoute.snapshot.queryParamMap.getAll(STATUS_QUERY_PARAM);
    this.statusFilterControl.setValue(
      statusQueryParam.length ? (statusQueryParam as FlowRunStatus[]) : []
    );
    const startDate = this.activatedRoute.snapshot.queryParamMap.get(
      DATE_RANGE_START_QUERY_PARAM
    );
    const endDate = this.activatedRoute.snapshot.queryParamMap.get(
      DATE_RANGE_END_QUERY_PARAM
    );
    this.dateFormGroup.setValue({
      start: startDate ? new Date(startDate) : null,
      end: endDate ? new Date(endDate) : null,
    });
    const allFlows$ = this.flowsService.list({
      projectId: this.currentProject,
      cursor: undefined,
      limit: 1000,
    });
    this.flows$ = combineLatest([
      allFlows$,
      this.flowFilterSearchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(100),
        distinctUntilChanged()
      ),
    ]).pipe(
      map(([flows, search]) => {
        this.allFlows.next(flows.data.map((flow) => flow.version.displayName));
        const flowVersions = flows.data.map((flow) => flow.version);
        return flowVersions.filter((flowVersion) =>
          flowVersion.displayName.toLowerCase().includes(search.toLowerCase())
        );
      })
    );
    this.filters = [
      {
        type: 'select',
        name: 'By Status',
        label: 'Filter by Status',
        formControl: this.statusFilterControl,
        queryParam: STATUS_QUERY_PARAM,
        allValues$: of(this.allStatuses),
        options$: of([
          { label: 'Running', value: this.ExecutionOutputStatus.RUNNING },
          { label: 'Failed', value: this.ExecutionOutputStatus.FAILED },
          { label: 'Timeout', value: this.ExecutionOutputStatus.TIMEOUT },
          { label: 'Stopped', value: this.ExecutionOutputStatus.STOPPED },
          { label: 'Succeeded', value: this.ExecutionOutputStatus.SUCCEEDED },
          { label: 'Paused', value: this.ExecutionOutputStatus.PAUSED },
          {
            label: 'Internal Error',
            value: this.ExecutionOutputStatus.INTERNAL_ERROR,
          },
        ]),
        optionLabelKey: 'label',
        optionValueKey: 'value',
        isMultipleSelect: true,
      },
      {
        type: 'select',
        name: 'By Flow',
        label: 'Filter by Flow',
        formControl: this.flowFilterControl,
        searchControl: this.flowFilterSearchControl,
        queryParam: FLOW_QUERY_PARAM,
        allValues$: this.allFlows.asObservable(),
        options$: this.flows$,
        optionLabelKey: 'displayName',
        optionValueKey: 'flowId',
      },
      {
        type: 'date',
        name: 'By Date',
        label: 'Filter by Date',
        dateFormGroup: this.dateFormGroup,
        queryParam: [DATE_RANGE_START_QUERY_PARAM, DATE_RANGE_END_QUERY_PARAM],
      },
    ];
  }

  ngOnInit(): void {
    this.filtersChanged$ = combineLatest({
      flowId: this.flowFilterControl.valueChanges.pipe(
        startWith(this.flowFilterControl.value)
      ),
      status: this.statusFilterControl.valueChanges.pipe(
        startWith(this.statusFilterControl.value)
      ),
      date: this.dateFormGroup.valueChanges.pipe(
        startWith(this.dateFormGroup.value)
      ),
    }).pipe(
      distinctUntilChanged(),
      tap((result) => {
        const createdAfter = new Date(result.date.start);
        const createdBefore = new Date(result.date.end);
        createdBefore.setHours(23, 59, 59, 999);
        if (
          this.activatedRoute.snapshot.fragment ===
            executionsPageFragments.Runs ||
          this.activatedRoute.snapshot.fragment === null
        ) {
          this.navigationService.navigate({
            route: ['runs'],
            openInNewWindow: false,
            extras: {
              fragment: this.embeddingService.getIsInEmbedding()
                ? undefined
                : executionsPageFragments.Runs,
              queryParams: {
                [FLOW_QUERY_PARAM]:
                  result.flowId === this.allOptionValue
                    ? undefined
                    : result.flowId,
                [STATUS_QUERY_PARAM]: result.status,
                [DATE_RANGE_START_QUERY_PARAM]: result.date.start
                  ? createdAfter.toISOString()
                  : undefined,
                [DATE_RANGE_END_QUERY_PARAM]: result.date.end
                  ? createdBefore.toISOString()
                  : undefined,
              },
              queryParamsHandling: 'merge',
            },
          });
        }
      }),
      map(() => undefined)
    );

    this.dataSource = new RunsTableDataSource(
      this.activatedRoute.queryParams,
      this.paginator,
      this.projectService,
      this.instanceRunService,
      this.refreshTableForReruns$.asObservable().pipe(startWith(true))
    );
  }

  openInstanceRun(run: FlowRun, event: MouseEvent) {
    const route = ['/runs/' + run.id];
    const openInNewWindow =
      event.ctrlKey || event.which == 2 || event.button == 4;
    this.navigationService.navigate({
      route: route,
      openInNewWindow,
    });
  }

  retryFlow(run: FlowRun, strategy: FlowRetryStrategy) {
    this.retryFlow$ = this.runsService.retry(run.id, strategy).pipe(
      tap(() => {
        this.refreshTableForReruns$.next(true);
      })
    );
  }

  getCurrentQueryParams() {
    return {
      [FLOW_QUERY_PARAM]:
        this.flowFilterControl.value === this.allOptionValue
          ? undefined
          : this.flowFilterControl.value,
      [STATUS_QUERY_PARAM]: this.statusFilterControl.value,
      [DATE_RANGE_START_QUERY_PARAM]: this.dateFormGroup.value.start
        ? this.dateFormGroup.value.start.toISOString()
        : undefined,
      [DATE_RANGE_END_QUERY_PARAM]: this.dateFormGroup.value.end
        ? this.dateFormGroup.value.end.toISOString()
        : undefined,
      [LIMIT_QUERY_PARAM]: this.paginator.pageSizeControl.value,
      ...spreadIfDefined(CURSOR_QUERY_PARAM, this.paginator.cursor),
    };
  }
  setParams(statuses: FlowRunStatus[], flowId: string, createdAt: string) {
    this.statusFilterControl.setValue(statuses);
    this.flowFilterControl.setValue(flowId);
    this.dateFormGroup.setValue({
      start: dayjs(createdAt).toDate(),
      end: null,
    });
  }
}
