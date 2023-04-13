import { DataSource } from '@angular/cdk/collections';

import {
  Observable,
  combineLatest,
  switchMap,
  tap,
  map,
  catchError,
} from 'rxjs';
import {
  ApPaginatorComponent,
  ProjectService,
  FlowService,
} from '@activepieces/ui/common';

import { FormControl } from '@angular/forms';
import { Flow } from '@activepieces/shared';

// TODO FIX
type CollectionListDtoWithInstanceStatusToggleControl = Flow & {
  instanceToggleControl: FormControl<boolean>;
};

/**
 * Data source for the LogsTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class FlowsTableDataSource extends DataSource<CollectionListDtoWithInstanceStatusToggleControl> {
  data: CollectionListDtoWithInstanceStatusToggleControl[] = [];
  public isLoading = true;
  constructor(
    private pageSize$: Observable<number>,
    private pageCursor$: Observable<string>,
    private paginator: ApPaginatorComponent,
    private projectService: ProjectService,
    private flowService: FlowService,
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
      project: this.projectService.getSelectedProject(),
      refresh: this.refresh$,
    }).pipe(
      tap(() => {
        this.isLoading = true;
      }),
      switchMap((res) => {
        return this.flowService.list({
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
  createTogglesControls(collections: Flow[]) {
    const controls: Record<string, FormControl> = {};
    collections.forEach((c) => {
      // TODO FIX
      controls[c.id] = new FormControl({
        value: false,
        disabled: true,
      });
    });
    return controls;
  }
}
