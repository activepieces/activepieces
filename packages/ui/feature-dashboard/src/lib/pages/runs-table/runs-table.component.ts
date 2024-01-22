import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  ApEdition,
  ExecutionOutputStatus,
  FlowId,
  FlowRetryStrategy,
  FlowRun,
  NotificationStatus,
  ProjectId,
  SeekPage,
} from '@activepieces/shared';
import { ActivatedRoute, Router } from '@angular/router';
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
  FlagService,
  ProjectSelectors,
  ProjectActions,
  NavigationService,
  AuthenticationService,
  FlowService,
} from '@activepieces/ui/common';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RunsService } from '../../services/runs.service';
import { DropdownOption } from '@activepieces/pieces-framework';
const allOptionValue = 'all';
@Component({
  templateUrl: './runs-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunsTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  readonly allOptionValue = allOptionValue;
  runsPage$: Observable<SeekPage<FlowRun>>;
  searchControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  nonCommunityEdition$: Observable<boolean>;
  toggleNotificationFormControl: FormControl<boolean> = new FormControl();
  dataSource!: RunsTableDataSource;
  displayedColumns = ['flowName', 'status', 'started', 'finished', 'action'];
  updateNotificationsValue$: Observable<boolean>;
  refreshTableForReruns$: Subject<boolean> = new Subject();
  statusFilterControl: FormControl<
    ExecutionOutputStatus | typeof allOptionValue
  > = new FormControl(allOptionValue, { nonNullable: true });
  flowFilterControl = new FormControl<string>(allOptionValue, {
    nonNullable: true,
  });
  selectedFlowName$: Observable<string | undefined>;
  flows$: Observable<DropdownOption<FlowId>[]>;
  currentProject: ProjectId;
  filtersChanged$: Observable<void>;
  readonly ExecutionOutputStatus = ExecutionOutputStatus;
  FlowRetryStrategy: typeof FlowRetryStrategy = FlowRetryStrategy;
  retryFlow$?: Observable<void>;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private flagsService: FlagService,
    private store: Store,
    private instanceRunService: InstanceRunService,
    private navigationService: NavigationService,
    private runsService: RunsService,
    private flowsService: FlowService,
    private authenticationService: AuthenticationService
  ) {}

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
      }),
      tap(console.log)
    );
    this.filtersChanged$ = combineLatest({
      flowId: this.flowFilterControl.valueChanges.pipe(
        startWith(this.flowFilterControl.value)
      ),
      status: this.statusFilterControl.valueChanges.pipe(
        startWith(this.statusFilterControl.value)
      ),
    }).pipe(
      distinctUntilChanged(),
      tap((result) => {
        this.router.navigate(['runs'], {
          queryParams: {
            flowId:
              result.flowId === this.allOptionValue ? undefined : result.flowId,
            status:
              result.status === this.allOptionValue ? undefined : result.status,
          },
        });
      }),
      map(() => undefined)
    );

    this.nonCommunityEdition$ = this.flagsService
      .getEdition()
      .pipe(map((res) => res !== ApEdition.COMMUNITY));
    this.updateNotificationsValue$ = this.store
      .select(ProjectSelectors.selectIsNotificationsEnabled)
      .pipe(
        tap((enabled) => {
          this.toggleNotificationFormControl.setValue(enabled);
        }),
        switchMap(() =>
          this.toggleNotificationFormControl.valueChanges.pipe(
            distinctUntilChanged(),
            tap((value) => {
              this.store.dispatch(
                ProjectActions.updateProject({
                  notifyStatus: value
                    ? NotificationStatus.ALWAYS
                    : NotificationStatus.NEVER,
                })
              );
            })
          )
        )
      );
    this.dataSource = new RunsTableDataSource(
      this.activatedRoute.queryParams,
      this.paginator,
      this.store,
      this.instanceRunService,
      this.refreshTableForReruns$.asObservable().pipe(startWith(true))
    );
  }

  openInstanceRun(run: FlowRun, event: MouseEvent) {
    const route = '/runs/' + run.id;
    const newWindow = event.ctrlKey || event.which == 2 || event.button == 4;
    this.navigationService.navigate(route, newWindow);
  }

  retryFlow(run: FlowRun, strategy: FlowRetryStrategy) {
    this.retryFlow$ = this.runsService.retry(run.id, strategy).pipe(
      tap(() => {
        this.refreshTableForReruns$.next(true);
      })
    );
  }
}
