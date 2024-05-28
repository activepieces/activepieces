import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FlowRunStatus,
  FlowId,
  FlowRetryStrategy,
  FlowRun,
  ProjectId,
  SeekPage,
  spreadIfDefined,
} from '@activepieces/shared';
import { ActivatedRoute } from '@angular/router';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
  startWith,
  Subject,
  switchMap,
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
} from '@activepieces/ui/common';
import { FormControl, FormGroup } from '@angular/forms';
import { RunsService } from '../../services/runs.service';
import { DropdownOption } from '@activepieces/pieces-framework';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
const allOptionValue = 'all';
@Component({
  templateUrl: './runs-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    UiCommonModule,
    ApDatePipe,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  selector: 'app-runs-table',
})
export class RunsTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  readonly allOptionValue = allOptionValue;
  runsPage$: Observable<SeekPage<FlowRun>>;
  searchControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  dataSource!: RunsTableDataSource;
  displayedColumns = ['flowName', 'status', 'started', 'duration', 'action'];
  refreshTableForReruns$: Subject<boolean> = new Subject();
  statusFilterControl: FormControl<FlowRunStatus | typeof allOptionValue> =
    new FormControl(allOptionValue, { nonNullable: true });
  flowFilterControl = new FormControl<string>(allOptionValue, {
    nonNullable: true,
  });
  dateFormGroup = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });
  selectedFlowName$: Observable<string | undefined>;
  flows$: Observable<DropdownOption<FlowId>[]>;
  currentProject: ProjectId;
  filtersChanged$: Observable<void>;
  readonly ExecutionOutputStatus = FlowRunStatus;
  FlowRetryStrategy: typeof FlowRetryStrategy = FlowRetryStrategy;
  retryFlow$?: Observable<void>;
  setInitialFilters$?: Observable<void>;

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
    this.flowFilterControl.setValue(
      this.activatedRoute.snapshot.queryParamMap.get(FLOW_QUERY_PARAM) ||
        this.allOptionValue
    );
    this.statusFilterControl.setValue(
      (this.activatedRoute.snapshot.queryParamMap.get(
        STATUS_QUERY_PARAM
      ) as FlowRunStatus) || this.allOptionValue
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
  }

  ngOnInit(): void {
    this.currentProject = this.authenticationService.getProjectId();
    this.flows$ = this.flowsService
      .list({
        projectId: this.currentProject,
        cursor: undefined,
        limit: 1000,
      })
      .pipe(
        map((res) => {
          return res.data.map((flow) => {
            return {
              label: flow.version.displayName,
              value: flow.id,
            };
          });
        }),
        shareReplay(1)
      );

    this.selectedFlowName$ = this.flowFilterControl.valueChanges.pipe(
      startWith(this.flowFilterControl.value),
      switchMap((flowId) => {
        return this.flows$.pipe(
          map((flows) => {
            return (
              flows.find((flow) => flow.value === flowId)?.label ||
              $localize`All`
            );
          })
        );
      })
    );
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
                [STATUS_QUERY_PARAM]:
                  result.status === this.allOptionValue
                    ? undefined
                    : result.status,
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
      [STATUS_QUERY_PARAM]:
        this.statusFilterControl.value === this.allOptionValue
          ? undefined
          : this.statusFilterControl.value,
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
  setParams(status: FlowRunStatus, flowId: string) {
    this.statusFilterControl.setValue(status);
    this.flowFilterControl.setValue(flowId);
  }
}
