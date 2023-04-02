import { DataSource } from '@angular/cdk/collections';

import {
  Observable,
  combineLatest,
  switchMap,
  tap,
  map,
  catchError,
} from 'rxjs';
import { CollectionListDto, CollectionStatus } from '@activepieces/shared';
import { ApPaginatorComponent } from '@/ui/common/src/lib/components/pagination/ap-paginator.component';
import { ProjectService } from '../../../common/service/project.service';
import { CollectionService } from '../../../common/service/collection.service';
import { FormControl } from '@angular/forms';

type CollectionListDtoWithInstanceStatusToggleControl = CollectionListDto & {
  instanceToggleControl: FormControl<boolean>;
};

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class CollectionsTableDataSource extends DataSource<CollectionListDtoWithInstanceStatusToggleControl> {
  data: CollectionListDtoWithInstanceStatusToggleControl[] = [];
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
  connect(): Observable<CollectionListDtoWithInstanceStatusToggleControl[]> {
    return combineLatest({
      pageCursor: this.pageCursor$,
      pageSize: this.pageSize$,
      project: this.projectService.selectedProjectAndTakeOne(),
      refresh: this.refresh$,
    }).pipe(
      tap(() => {
        this.isLoading = true;
      }),
      switchMap((res) => {
        return this.collectionService.list({
          projectId: res.project.id,
          limit: res.pageSize,
          cursor: res.pageCursor,
        });
      }),
      catchError((err) => {
        throw err;
      }),
      tap((res) => {
        this.paginator.next = res.next;
        this.paginator.previous = res.previous;
        this.isLoading = false;
        const instanceTogglesControls = this.createTogglesControls(res.data);
        this.data = res.data.map((c) => {
          return {
            ...c,
            instanceToggleControl: instanceTogglesControls[c.id],
          };
        });
      }),
      map(() => this.data)
    );
  }

  /**
   *  Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect(): void {
    //ignore
  }
  createTogglesControls(collections: CollectionListDto[]) {
    const controls: Record<string, FormControl> = {};
    collections.forEach((c) => {
      controls[c.id] = new FormControl({
        value: c.status === CollectionStatus.ENABLED ? true : false,
        disabled: c.status === CollectionStatus.UNPUBLISHED,
      });
    });
    return controls;
  }
}
