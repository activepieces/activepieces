import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { IssuesDataSource } from './issues-table.datasource';
import { IssuesService } from '../../services/issues.service';
import {
  ApDatePipe,
  ApPaginatorComponent,
  AuthenticationService,
  CURSOR_QUERY_PARAM,
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
  EmbeddingService,
  FLOW_QUERY_PARAM,
  FlagService,
  LIMIT_QUERY_PARAM,
  NavigationService,
  ProjectService,
  STATUS_QUERY_PARAM,
  TelemetryService,
  UiCommonModule,
  executionsPageFragments,
} from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';
import { PopulatedIssue } from '@activepieces/ee-shared';
import {
  ApEdition,
  FlowRunStatus,
  NotificationStatus,
  ProjectId,
  TelemetryEventName,
  spreadIfDefined,
} from '@activepieces/shared';
import { MatDialog } from '@angular/material/dialog';
import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  map,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-issues-table',
  templateUrl: './issues-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, UiCommonModule, ApDatePipe],
})
export class IssuesTableComponent implements OnInit {
  readonly betaNote =
    'Note: This feature is in <strong>BETA</strong> and will only be <strong>Free</strong> during the <strong>BETA</strong> period.';
  @Input({ required: true }) isFeatureDisabled = true;
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator: ApPaginatorComponent;
  dataSource: IssuesDataSource;
  displayedColumns: string[] = [
    'name',
    'count',
    'firstSeen',
    'lastSeen',
    'action',
  ];
  resolve$: Observable<unknown>;
  currentProject: ProjectId;
  updateNotificationsValue$: Observable<unknown>;
  nonCommunityEdition$: Observable<boolean>;
  toggleNotificationFormControl: FormControl<boolean> = new FormControl();
  refresh$ = new BehaviorSubject<boolean>(true);
  readonly upgradeNoteTitle = $localize`Unlock Issues`;
  readonly upgradeNote = $localize`Centralized issue tracking without digging through pages of flow runs.`;
  @Output()
  issueClicked = new EventEmitter<{ issue: PopulatedIssue }>();
  constructor(
    private issuesService: IssuesService,
    private authService: AuthenticationService,
    private route: ActivatedRoute,
    private navigationService: NavigationService,
    private matDialog: MatDialog,
    private telemetryService: TelemetryService,
    private embeddingService: EmbeddingService,
    private flagsService: FlagService,
    private projectService: ProjectService
  ) {}
  ngOnInit(): void {
    this.currentProject = this.authService.getProjectId();
    this.dataSource = new IssuesDataSource(
      this.route.queryParams,
      this.paginator,
      this.issuesService,
      this.authService.getProjectId(),
      this.refresh$.asObservable()
    );
    this.nonCommunityEdition$ = this.flagsService
      .getEdition()
      .pipe(map((res) => res !== ApEdition.COMMUNITY));
    this.updateNotificationsValue$ = this.projectService.currentProject$.pipe(
      take(1),
      tap((project) => {
        this.toggleNotificationFormControl.setValue(
          project?.notifyStatus === NotificationStatus.ALWAYS
        );
      }),
      switchMap(() => {
        return this.toggleNotificationFormControl.valueChanges.pipe(
          distinctUntilChanged(),
          switchMap((value) => {
            return this.projectService.update(this.currentProject, {
              notifyStatus: value
                ? NotificationStatus.ALWAYS
                : NotificationStatus.NEVER,
            });
          })
        );
      })
    );
  }

  openRuns(issue: PopulatedIssue, event: MouseEvent) {
    this.telemetryService.capture({
      name: TelemetryEventName.FLOW_ISSUE_CLICKED,
      payload: {
        flowId: issue.flowId,
      },
    });
    const openInNewWindow =
      event.ctrlKey || event.which == 2 || event.button == 4;
    if (openInNewWindow && !this.embeddingService.getState().isEmbedded) {
      this.navigationService.navigate({
        route: ['/runs'],
        extras: {
          fragment: executionsPageFragments.Runs,
          queryParams: {
            [FLOW_QUERY_PARAM]: issue.flowId,
            [STATUS_QUERY_PARAM]: FlowRunStatus.FAILED,
          },
        },
        openInNewWindow,
      });
    } else {
      this.issueClicked.emit({ issue });
    }
  }

  resolve(issue: PopulatedIssue) {
    const data: ConfirmActionDialogData = {
      action$: this.issuesService.resolve(issue.id),
      note: $localize`Are you sure you resolved all of <b>${issue.flowDisplayName}</b>'s issues?`,
      successMessage: $localize`Marked <b>${issue.flowDisplayName}</b> issues as resolved successfully`,
      title: $localize`Resolve`,
    };
    this.resolve$ = this.matDialog
      .open(ConfirmActionDialogComponent, {
        data,
      })
      .afterClosed()
      .pipe(
        tap((resolved) => {
          if (resolved) {
            this.refresh$.next(true);
            this.issuesService.refreshIssuesCount();
          }
        })
      );
  }

  getCurrentQueryParams() {
    return {
      [LIMIT_QUERY_PARAM]: this.paginator.pageSizeControl.value,
      ...spreadIfDefined(CURSOR_QUERY_PARAM, this.paginator.cursor),
    };
  }
}
