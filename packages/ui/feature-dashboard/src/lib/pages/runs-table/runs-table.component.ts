import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  ApEdition,
  ExecutionOutputStatus,
  FlowRun,
  NotificationStatus,
  SeekPage,
} from '@activepieces/shared';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map, Observable, switchMap, tap } from 'rxjs';
import { RunsTableDataSource } from './runs-table.datasource';
import {
  InstanceRunService,
  ApPaginatorComponent,
  FlagService,
  ProjectSelectors,
  ProjectActions,
} from '@activepieces/ui/common';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';

@Component({
  templateUrl: './runs-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunsTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  runsPage$: Observable<SeekPage<FlowRun>>;
  enterpriseEdition$: Observable<boolean>;
  toggleNotificationFormControl: FormControl<boolean> = new FormControl();
  dataSource!: RunsTableDataSource;
  displayedColumns = ['flowName', 'status', 'started', 'finished'];
  updateNotificationsValue$: Observable<boolean>;
  selectedStatus: FormControl<ExecutionOutputStatus | undefined> =
    new FormControl();
  changeRunStatus$: Observable<void>;
  readonly ExecutionOutputStatus = ExecutionOutputStatus;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private flagsService: FlagService,
    private store: Store,
    private instanceRunService: InstanceRunService
  ) {}

  ngOnInit(): void {
    this.changeRunStatus$ = this.selectedStatus.valueChanges.pipe(
      distinctUntilChanged(),
      tap((status) => {
        this.router.navigate(['runs'], {
          queryParams: {
            status:
              status && status in ExecutionOutputStatus ? status : undefined,
          },
        });
      }),
      map(() => undefined)
    );
    this.enterpriseEdition$ = this.flagsService
      .getEdition()
      .pipe(map((res) => res === ApEdition.ENTERPRISE));
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
      this.instanceRunService
    );
  }

  openInstanceRun(run: FlowRun) {
    const url =
      this.router.serializeUrl(this.router.createUrlTree(['/runs'])) +
      '/' +
      run.id;
    window.open(url, '_blank');
  }

  public getStatusText(status: ExecutionOutputStatus): string {
    switch (status) {
      case ExecutionOutputStatus.RUNNING:
        return 'Running';
      case ExecutionOutputStatus.SUCCEEDED:
        return 'Succeeded';
      case ExecutionOutputStatus.FAILED:
        return 'Failed';
      case ExecutionOutputStatus.TIMEOUT:
        return 'Timed out';
      default:
        return 'Internal Error';
    }
  }
}
