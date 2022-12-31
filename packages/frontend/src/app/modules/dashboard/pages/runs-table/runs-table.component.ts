import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { ExecutionOutputStatus, FlowRun, SeekPage } from 'shared';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { RunsTableDataSource } from './runs-table.datasource';
import { ApPaginatorComponent } from 'src/app/modules/common/components/pagination/ap-paginator.component';
import { DEFAULT_PAGE_SIZE } from 'src/app/modules/common/components/pagination/tables.utils';
import { ProjectService } from 'src/app/modules/common/service/project.service';
import { InstanceRunService } from 'src/app/modules/common/service/flow-run.service';
@Component({
	templateUrl: './runs-table.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunsComponent implements OnInit {
	@ViewChild(ApPaginatorComponent, { static: true }) paginator!: ApPaginatorComponent;
	runsPage$: Observable<SeekPage<FlowRun>>;
	dataSource!: RunsTableDataSource;
	displayedColumns = ['collectionName', 'flowName', 'status', 'started', 'finished'];
	readonly InstanceRunStatus = ExecutionOutputStatus;

	constructor(
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private projectService: ProjectService,
		private instanceRunService: InstanceRunService
	) {}

	ngOnInit(): void {
		this.dataSource = new RunsTableDataSource(
			this.activatedRoute.queryParams.pipe(map(res => res['limit'] || DEFAULT_PAGE_SIZE)),
			this.activatedRoute.queryParams.pipe(map(res => res['cursor'])),
			this.paginator,
			this.projectService,
			this.instanceRunService
		);
	}

	openInstanceRun(run: FlowRun) {
		const url = this.router.serializeUrl(this.router.createUrlTree(['/runs'])) + '/' + run.id;
		window.open(url, '_blank');
	}

	instanceRunEnum() {
		return ExecutionOutputStatus;
	}
}
