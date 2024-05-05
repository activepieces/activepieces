import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { IssuesDataSource } from './issues-table.datasource';
import { IssuesService } from '../../services/issues.service';
import {
  ApPaginatorComponent,
  AuthenticationService,
  ConfirmActionDialogComponent,
  ConfirmActionDialogData,
  FLOW_QUERY_PARAM,
  NavigationService,
  STATUS_QUERY_PARAM,
} from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';
import { PopulatedIssue } from '@activepieces/ee-shared';
import { FlowRunStatus } from '@activepieces/shared';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Component({
  selector: 'app-issues-table',
  templateUrl: './issues-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssuesTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator: ApPaginatorComponent;
  dataSource: IssuesDataSource;
  displayedColumns: string[] = ['name', 'count', 'lastOccurrence', 'action'];
  resolve$: Observable<unknown>;
  refresh$ = new BehaviorSubject<boolean>(true);
  constructor(
    private issuesService: IssuesService,
    private authService: AuthenticationService,
    private route: ActivatedRoute,
    private navigationService: NavigationService,
    private matDialog: MatDialog
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
    this.navigationService.navigate({
      route: ['/runs'],
      extras: {
        queryParams: {
          [FLOW_QUERY_PARAM]: issue.flowId,
          [STATUS_QUERY_PARAM]: FlowRunStatus.FAILED,
        },
      },
      openInNewWindow,
    });
  }

  resolve(issue: PopulatedIssue) {
    const data: ConfirmActionDialogData = {
      action$: this.issuesService.resolve(issue.id),
      note: $localize`Are you sure you resolved all of <b>${issue.flowDisplayName}</b>'s issues?`,
      successMessage: $localize`Resolved successfully`,
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
          }
        })
      );
  }
}
