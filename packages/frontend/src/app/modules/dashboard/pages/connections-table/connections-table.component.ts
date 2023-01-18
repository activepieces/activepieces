import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AppConnection, SeekPage } from 'shared';
import { ApPaginatorComponent } from 'src/app/modules/common/components/pagination/ap-paginator.component';
import { DEFAULT_PAGE_SIZE } from 'src/app/modules/common/components/pagination/tables.utils';
import { AppConnectionsService } from 'src/app/modules/common/service/app-connections.service';
import { ProjectService } from 'src/app/modules/common/service/project.service';
import { ConnectionsTableDataSource } from './connections-table.datasource';

@Component({
	templateUrl: './connections-table.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionsTableComponent {
	@ViewChild(ApPaginatorComponent, { static: true }) paginator!: ApPaginatorComponent;
	connectionPage$: Observable<SeekPage<AppConnection>>;
	dataSource!: ConnectionsTableDataSource;
	displayedColumns = ['app', 'name', 'created', 'updated', 'action'];

	constructor(
		private activatedRoute: ActivatedRoute,
		private projectService: ProjectService,
		private connectionService: AppConnectionsService
	) {}

	ngOnInit(): void {
		this.dataSource = new ConnectionsTableDataSource(
			this.activatedRoute.queryParams.pipe(map(res => res['limit'] || DEFAULT_PAGE_SIZE)),
			this.activatedRoute.queryParams.pipe(map(res => res['cursor'])),
			this.paginator,
			this.projectService,
			this.connectionService
		);
	}
}
