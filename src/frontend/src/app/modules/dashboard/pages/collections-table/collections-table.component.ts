import { Component, OnInit, ViewChild } from '@angular/core';
import { Collection } from '../../../common/model/collection.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionService } from '../../../common/service/collection.service';
import { AuthenticationService } from '../../../common/service/authentication.service';
import { ProjectService } from 'src/app/modules/common/service/project.service';
import { map, Observable, startWith, Subject, switchMap, tap } from 'rxjs';
import { FlowService } from 'src/app/modules/common/service/flow.service';
import { Flow } from 'src/app/modules/common/model/flow.class';
import { PosthogService } from 'src/app/modules/common/service/posthog.service';
import { ApPaginatorComponent } from 'src/app/modules/common/components/pagination/ap-paginator.component';
import { CollectionsTableDataSource } from './collections-table.datasource';
import { MatDialog } from '@angular/material/dialog';
import { ArchiveCollectionDialogComponent } from './archive-collection-dialog/archive-collection-dialog.component';
import { ARE_THERE_COLLECTIONS_FLAG } from '../../dashboard.routing';
import { DEFAULT_PAGE_SIZE } from 'src/app/modules/common/components/pagination/tables.utils';
@Component({
	templateUrl: './collections-table.component.html',
})
export class CollectionsTableComponent implements OnInit {
	@ViewChild(ApPaginatorComponent, { static: true }) paginator!: ApPaginatorComponent;
	creatingCollection = false;
	archiveCollectionDialogClosed$: Observable<void>;
	createCollection$: Observable<Flow>;
	dataSource!: CollectionsTableDataSource;
	displayedColumns = ['name', 'created', 'action'];
	collectionArchived$: Subject<boolean> = new Subject();
	areThereCollections$: Observable<boolean>;
	constructor(
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private authenticationService: AuthenticationService,
		private collectionService: CollectionService,
		private dialogService: MatDialog,
		private projectService: ProjectService,
		private flowService: FlowService,
		private posthogService: PosthogService
	) {}

	ngOnInit(): void {
		this.dataSource = new CollectionsTableDataSource(
			this.activatedRoute.queryParams.pipe(map(res => res['limit'] || DEFAULT_PAGE_SIZE)),
			this.activatedRoute.queryParams.pipe(map(res => res['cursor'])),
			this.paginator,
			this.projectService,
			this.collectionService,
			this.collectionArchived$.asObservable().pipe(startWith(true))
		);
		this.areThereCollections$ = this.activatedRoute.data.pipe(
			map(res => {
				debugger;
				return res[ARE_THERE_COLLECTIONS_FLAG];
			})
		);
	}

	openBuilder(collection: Collection) {
		const link = '/flows/' + collection.id;
		this.router.navigate([link]);
	}

	archiveCollection(collection: Collection) {
		const dialogRef = this.dialogService.open(ArchiveCollectionDialogComponent, { data: { ...collection } });
		this.archiveCollectionDialogClosed$ = dialogRef.beforeClosed().pipe(
			tap(res => {
				if (res) {
					this.collectionArchived$.next(true);
				}
			}),
			map(() => {
				return void 0;
			})
		);
	}

	createCollection() {
		if (!this.creatingCollection) {
			this.creatingCollection = true;
			const collectionDiplayName = 'Untitled';
			this.createCollection$ = this.projectService.selectedProjectAndTakeOne().pipe(
				switchMap(project => {
					return this.collectionService.create(project.id, {
						display_name: collectionDiplayName,
					});
				}),
				switchMap(collection => {
					if (this.authenticationService.currentUserSubject.value?.track_events) {
						this.posthogService.captureEvent('collection.created [Builder]', collection);
					}
					return this.flowService.create(collection.id, 'Flow 1');
				}),
				tap(flow => {
					if (this.authenticationService.currentUserSubject.value?.track_events) {
						this.posthogService.captureEvent('flow.created [Builder]', flow);
					}
					this.router.navigate(['/flows/', flow.collection_id], { queryParams: { newCollection: true } });
				})
			);
		}
	}
}
