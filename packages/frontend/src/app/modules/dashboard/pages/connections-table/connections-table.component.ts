import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, startWith, Subject, tap } from 'rxjs';
import { AppConnection, SeekPage } from '@activepieces/shared';
import { ApPaginatorComponent } from 'packages/frontend/src/app/modules/common/components/pagination/ap-paginator.component';
import { DEFAULT_PAGE_SIZE } from 'packages/frontend/src/app/modules/common/components/pagination/tables.utils';
import { AppConnectionsService } from 'packages/frontend/src/app/modules/common/service/app-connections.service';
import { ProjectService } from 'packages/frontend/src/app/modules/common/service/project.service';
import {
	DeleteEntityDialogComponent,
	DeleteEntityDialogData,
} from '../../components/delete-enity-dialog/delete-collection-dialog.component';
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
	connectionDeleted$: Subject<boolean> = new Subject();
	deleteConnectionDialogClosed$: Observable<void>;
	constructor(
		private activatedRoute: ActivatedRoute,
		private projectService: ProjectService,
		private connectionService: AppConnectionsService,
		private dialogService: MatDialog
	) {}

	ngOnInit(): void {
		this.dataSource = new ConnectionsTableDataSource(
			this.activatedRoute.queryParams.pipe(map(res => res['limit'] || DEFAULT_PAGE_SIZE)),
			this.activatedRoute.queryParams.pipe(map(res => res['cursor'])),
			this.paginator,
			this.projectService,
			this.connectionService,
			this.connectionDeleted$.asObservable().pipe(startWith(true))
		);
	}
	deleteConnection(connection: AppConnection) {
		const dialogRef = this.dialogService.open(DeleteEntityDialogComponent, {
			data: {
				deleteEntity$: this.connectionService.delete(connection.id),
				entityName: connection.name,
				note: { text: 'When this connection is deleted, all steps using it might fail', danger: true },
			} as DeleteEntityDialogData,
		});
		this.deleteConnectionDialogClosed$ = dialogRef.beforeClosed().pipe(
			tap(res => {
				if (res) {
					this.connectionDeleted$.next(true);
				}
			}),
			map(() => {
				return void 0;
			})
		);
	}
}
