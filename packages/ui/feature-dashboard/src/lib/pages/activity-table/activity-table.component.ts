import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivityableDataSource } from './activity-table.datasource';
import { ActivityService } from '../../services/activity.service';
import {
  ApPaginatorComponent,
  AuthenticationService,
} from '@activepieces/ui/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-activity-table',
  templateUrl: './activity-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator: ApPaginatorComponent;
  dataSource: ActivityableDataSource;
  displayedColumns: string[] = ['event', 'message', 'status', 'created'];
  constructor(
    private activityService: ActivityService,
    private authService: AuthenticationService,
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.dataSource = new ActivityableDataSource(
      this.route.queryParams,
      this.paginator,
      this.activityService,
      this.authService.getProjectId()
    );
  }
}
