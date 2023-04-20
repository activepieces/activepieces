import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, startWith, Subject, tap } from 'rxjs';
import {
  AppConnection,
  AppConnectionStatus,
  SeekPage,
} from '@activepieces/shared';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
} from '@activepieces/ui/common';
import { ConnectionsTableDataSource } from './connections-table.datasource';
import { ApPaginatorComponent } from '@activepieces/ui/common';
import {
  ProjectService,
  DEFAULT_PAGE_SIZE,
  AppConnectionsService,
} from '@activepieces/ui/common';

@Component({
  templateUrl: './connections-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionsTableComponent {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  connectionPage$: Observable<SeekPage<AppConnection>>;
  dataSource!: ConnectionsTableDataSource;
  displayedColumns = ['app', 'name', 'status', 'created', 'updated', 'action'];
  connectionDeleted$: Subject<boolean> = new Subject();
  deleteConnectionDialogClosed$: Observable<void>;
  readonly AppConnectionStatus = AppConnectionStatus;
  constructor(
    private activatedRoute: ActivatedRoute,
    private projectService: ProjectService,
    private connectionService: AppConnectionsService,
    private dialogService: MatDialog
  ) {}

  ngOnInit(): void {
    this.dataSource = new ConnectionsTableDataSource(
      this.activatedRoute.queryParams.pipe(
        map((res) => res['limit'] || DEFAULT_PAGE_SIZE)
      ),
      this.activatedRoute.queryParams.pipe(map((res) => res['cursor'])),
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
        note: {
          text: 'When this connection is deleted, all steps using it will fail',
          danger: true,
        },
      } as DeleteEntityDialogData,
    });
    this.deleteConnectionDialogClosed$ = dialogRef.beforeClosed().pipe(
      tap((res) => {
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
