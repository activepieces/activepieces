import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
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
  LIMIT_QUERY_PARAM,
  NavigationService,
  STATUS_QUERY_PARAM,
  UiCommonModule,
  executionsPageFragments,
} from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';
import { PopulatedIssue } from '@activepieces/ee-shared';
import { FlowRunStatus, spreadIfDefined } from '@activepieces/shared';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-issues-table',
  templateUrl: './issues-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, UiCommonModule, ApDatePipe],
})
export class IssuesTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator: ApPaginatorComponent;
  dataSource: IssuesDataSource;
  displayedColumns: string[] = ['name', 'count', 'lastOccurrence', 'action'];
  resolve$: Observable<unknown>;
  refresh$ = new BehaviorSubject<boolean>(true);
  readonly betaNote = $localize`<b> Note: </b> This feature is in <b>BETA</b>, and it will only be free during the <b>BETA</b> period.`;
  @Output()
  issueClicked = new EventEmitter<{ issue: PopulatedIssue }>();
  constructor(
    private issuesService: IssuesService,
    private authService: AuthenticationService,
    private route: ActivatedRoute,
    private navigationService: NavigationService,
    private matDialog: MatDialog,
    private embeddingService: EmbeddingService
  ) {}
  ngOnInit(): void {
    this.dataSource = new IssuesDataSource(
      this.route.queryParams,
      this.paginator,
      this.issuesService,
      this.authService.getProjectId(),
      this.refresh$.asObservable()
    );
  }

  openRuns(issue: PopulatedIssue, event: MouseEvent) {
    const openInNewWindow =
      event.ctrlKey || event.which == 2 || event.button == 4;
    if (openInNewWindow && !this.embeddingService.getState().isEmbedded) {
      this.navigationService.navigate({
        route: ['/executions'],
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
