import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ExecutionOutputStatus, FlowRun, SeekPage } from '@activepieces/shared';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { RunsTableDataSource } from './runs-table.datasource';
import { ProjectService } from '../../../common/service/project.service';
import { InstanceRunService } from '../../../common/service/flow-run.service';
import { ApPaginatorComponent } from '@/ui/common/src/lib/components/pagination/ap-paginator.component';
import { DEFAULT_PAGE_SIZE } from '@/ui/common/src/lib/components/pagination/tables.utils';
@Component({
  templateUrl: './runs-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunsTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  runsPage$: Observable<SeekPage<FlowRun>>;
  dataSource!: RunsTableDataSource;
  displayedColumns = [
    'collectionName',
    'flowName',
    'status',
    'started',
    'finished',
  ];
  readonly ExecutionOutputStatus = ExecutionOutputStatus;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private projectService: ProjectService,
    private instanceRunService: InstanceRunService
  ) {}

  ngOnInit(): void {
    this.dataSource = new RunsTableDataSource(
      this.activatedRoute.queryParams.pipe(
        map((res) => res['limit'] || DEFAULT_PAGE_SIZE)
      ),
      this.activatedRoute.queryParams.pipe(map((res) => res['cursor'])),
      this.paginator,
      this.projectService,
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
        return 'Success';
      case ExecutionOutputStatus.FAILED:
        return 'Failed';
      case ExecutionOutputStatus.TIMEOUT:
        return 'Timed out';
      default:
        return 'Internal Error';
    }
  }
}
