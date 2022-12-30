import { DataSource } from '@angular/cdk/collections';

import { Observable, combineLatest, switchMap, tap, map, catchError } from 'rxjs';
import { ApPaginatorComponent } from 'src/app/modules/common/components/pagination/ap-paginator.component';
import { Collection } from 'src/app/modules/common/model/collection.interface';
import { CollectionService } from 'src/app/modules/common/service/collection.service';
import { ProjectService } from 'src/app/modules/common/service/project.service';

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class CollectionsTableDataSource extends DataSource<Collection> {
	data: Collection[] = [];
	public isLoading = true;
	constructor(
		private pageSize$: Observable<number>,
		private pageCursor$: Observable<string>,
		private paginator: ApPaginatorComponent,
		private projectService: ProjectService,
		private collectionService: CollectionService,
		private refresh$: Observable<boolean>
	) {
		super();
	}

	/**
	 * Connect this data source to the table. The table will only update when
	 * the returned stream emits new items.
	 * @returns A stream of the items to be rendered.
	 */
	connect(): Observable<Collection[]> {
		return combineLatest({
			pageCursor: this.pageCursor$,
			pageSize: this.pageSize$,
			project: this.projectService.selectedProjectAndTakeOne(),
			refresh: this.refresh$,
		}).pipe(
			tap(() => {
				this.isLoading = true;
			}),
			switchMap(res => {
				return this.collectionService.list( {  projectId: res.project.id, limit: res.pageSize, cursor: res.pageCursor });
			}),
			catchError(err => {
				throw err;
			}),
			tap(res => {
				this.paginator.next = res.next;
				this.paginator.previous = res.previous;
				this.data = res.data;
				this.isLoading = false;
			}),
			map(res => res.data)
		);
	}

	/**
	 *  Called when the table is being destroyed. Use this function, to clean up
	 * any open connections or free any held resources that were set up during connect.
	 */
	disconnect(): void {}
}
