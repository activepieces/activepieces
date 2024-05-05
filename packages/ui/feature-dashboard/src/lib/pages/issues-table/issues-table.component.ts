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
  NavigationService,
} from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';
import { IssueStatus, PopulatedIssue } from '@activepieces/ee-shared';
import { FlowRunStatus } from '@activepieces/shared';

@Component({
  selector: 'app-issues-table',
  templateUrl: './issues-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssuesTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator: ApPaginatorComponent;
  dataSource: IssuesDataSource;
  displayedColumns: string[] = [
    'status',
    'name',
    'count',
    'lastOccurrence',
    'action',
  ];
  constructor(
    private issuesService: IssuesService,
    private authService: AuthenticationService,
    private route: ActivatedRoute,
    private navigationService: NavigationService
  ) {}
  ngOnInit(): void {
    this.dataSource = new IssuesDataSource(
      this.route.queryParams,
      this.paginator,
      this.issuesService,
      this.authService.getProjectId()
    );
  }

  statusText(issue: IssueStatus) {
    switch (issue) {
      case IssueStatus.ONGOING:
        return 'Ongoing';
      case IssueStatus.RESOLEVED:
        return 'Resolved';
    }
  }

  openRuns(issue: PopulatedIssue, event: MouseEvent) {
    const openInNewWindow =
      event.ctrlKey || event.which == 2 || event.button == 4;
    this.navigationService.navigate({
      route: ['/runs'],
      extras: {
        queryParams: {
          flowId: issue.flowId,
          status: FlowRunStatus.FAILED,
        },
      },
      openInNewWindow,
    });
  }
}
