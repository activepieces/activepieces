import {
  NotificationStatus,
  Platform,
  ProjectId,
  ProjectMemberRole,
} from '@activepieces/shared';
import {
  ApPaginatorComponent,
  AuthenticationService,
  GenericSnackbarTemplateComponent,
  PLATFORM_RESOLVER_KEY,
  ProjectService,
  UiCommonModule,
} from '@activepieces/ui/common';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  delay,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { AlertsDataSource } from './alerts-table.datasource';
import { AlertsService } from '../../services/alerts.service';
import { MatDialog } from '@angular/material/dialog';
import { NewAlertDialogComponent } from '../dialogs/new-alert-dialog/new-alert-dialog.component';
import { Alert } from '@activepieces/ee-shared';
import { ProjectMemberService } from 'ee-project-members';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-alerts-table',
  templateUrl: './alerts-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [UiCommonModule, AsyncPipe],
})
export class AlertsTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator: ApPaginatorComponent;
  updatingAlertsFrequency$ = new BehaviorSubject<boolean>(false);
  readonly permissionToAddMessage = $localize`You don\'t have permissions to add email`;
  readonly permissionToDeleteMessage = $localize`You don\'t have permissions to delete email`;
  upgradeNoteTitle = $localize`Unlock Alerts`;
  upgradeNote = $localize`Stay up to date with your flows, quota limits and updates with Alerts`;
  displayedColumns: string[] = ['receiver', 'action'];
  showUpgrade = true;
  dataSource: AlertsDataSource;
  currentProject$: ProjectId;
  refresh$ = new BehaviorSubject<boolean>(true);
  addAlertDialogClosed$?: Observable<unknown>;
  isAdmin$: Observable<boolean>;
  deleteAlert$: Observable<void> | undefined;
  notificationControl: FormControl<NotificationStatus> = new FormControl(
    NotificationStatus.NEVER,
    {
      nonNullable: true,
    }
  );
  updateNotificationsValue$: Observable<unknown>;
  currentProject: ProjectId;
  selectTriggerDisplayName$: Observable<string | undefined>;
  optionItems: {
    name: NotificationStatus;
    displayName: string;
  }[] = [
    {
      name: NotificationStatus.NEW_ISSUE,
      displayName: $localize`New Issue`,
    },
    {
      name: NotificationStatus.ALWAYS,
      displayName: $localize`Every Failed Run`,
    },
    {
      name: NotificationStatus.NEVER,
      displayName: $localize`Never`,
    },
  ];
  constructor(
    private dialogService: MatDialog,
    private alertsService: AlertsService,
    private route: ActivatedRoute,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar,
    private projectMemberService: ProjectMemberService,
    private projectService: ProjectService
  ) {
    this.currentProject = this.authService.getProjectId();
    this.showUpgrade = !(
      this.route.snapshot.data[PLATFORM_RESOLVER_KEY] as Platform
    ).alertsEnabled;
    this.selectTriggerDisplayName$ = this.notificationControl.valueChanges.pipe(
      map((value) => {
        const item = this.optionItems.find((opt) => opt.name === value);
        if (item) {
          return item.displayName;
        }
        return undefined;
      })
    );
  }

  ngOnInit(): void {
    this.currentProject$ = this.authService.getProjectId();
    this.isAdmin$ = this.projectMemberService.isRole(ProjectMemberRole.ADMIN);
    this.updateNotificationsValue$ = this.projectService.currentProject$.pipe(
      take(1),
      tap((project) => {
        this.notificationControl.setValue(NotificationStatus.NEVER);
        if (project) {
          this.notificationControl.setValue(project.notifyStatus);
        }
      }),
      switchMap(() => {
        return this.notificationControl.valueChanges.pipe(
          distinctUntilChanged(),
          tap(() => {
            this.updatingAlertsFrequency$.next(true);
          }),
          switchMap((value) => {
            return this.projectService.update(this.currentProject, {
              notifyStatus: value,
            });
          }),
          delay(300),
          tap(() => {
            this.updatingAlertsFrequency$.next(false);
          })
        );
      })
    );
    this.dataSource = new AlertsDataSource(
      this.route.queryParams,
      this.paginator,
      this.alertsService,
      this.authService.getProjectId(),
      this.refresh$.asObservable().pipe(startWith(false))
    );
  }

  addAlert(): void {
    this.addAlertDialogClosed$ = this.dialogService
      .open(NewAlertDialogComponent, {
        restoreFocus: false,
      })
      .afterClosed()
      .pipe(
        tap((res) => {
          if (res) {
            this.refresh$.next(true);
          }
        })
      );
  }

  deleteAlert(alert: Alert): void {
    this.deleteAlert$ = this.alertsService.remove(alert.id).pipe(
      tap(() => {
        this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
          data: `Email ${alert.receiver} deleted`,
        });
        this.refresh$.next(true);
      })
    );
  }
}
