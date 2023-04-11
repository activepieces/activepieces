import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable, startWith, Subject, switchMap, tap } from 'rxjs';
import { CollectionsTableDataSource } from './collections-table.datasource';
import { MatDialog } from '@angular/material/dialog';
import {
  Collection,
  CollectionListDto,
  CollectionStatus,
  Flow,
  InstanceStatus,
} from '@activepieces/shared';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
} from '../../components/delete-enity-dialog/delete-entity-dialog.component';
import { FormControl } from '@angular/forms';
import { ApPaginatorComponent } from '@activepieces/ui/common';
import {
  CollectionService,
  ProjectService,
  FlowService,
  InstanceService,
  DEFAULT_PAGE_SIZE,
} from '@activepieces/ui/common';
import { ARE_THERE_COLLECTIONS_FLAG } from '../../resolvers/are-there-collections.resolver';

@Component({
  templateUrl: './collections-table.component.html',
})
export class CollectionsTableComponent implements OnInit {
  @ViewChild(ApPaginatorComponent, { static: true })
  paginator!: ApPaginatorComponent;
  creatingCollection = false;
  archiveCollectionDialogClosed$: Observable<void>;
  createCollection$: Observable<Flow>;
  dataSource!: CollectionsTableDataSource;
  displayedColumns = ['name', 'created', 'status', 'action'];
  collectionDeleted$: Subject<boolean> = new Subject();
  areThereCollections$: Observable<boolean>;
  collectionsUpdateStatusRequest$: Record<string, Observable<void> | null> = {};
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
    private dialogService: MatDialog,
    private projectService: ProjectService,
    private flowService: FlowService,
    private instanceService: InstanceService
  ) {}

  ngOnInit(): void {
    this.dataSource = new CollectionsTableDataSource(
      this.activatedRoute.queryParams.pipe(
        map((res) => res['limit'] || DEFAULT_PAGE_SIZE)
      ),
      this.activatedRoute.queryParams.pipe(map((res) => res['cursor'])),
      this.paginator,
      this.projectService,
      this.collectionService,
      this.collectionDeleted$.asObservable().pipe(startWith(true))
    );
    this.areThereCollections$ = this.activatedRoute.data.pipe(
      map((res) => {
        return res[ARE_THERE_COLLECTIONS_FLAG];
      })
    );
  }

  openBuilder(collection: Collection) {
    const link = '/flows/' + collection.id;
    this.router.navigate([link]);
  }

  deleteCollection(collection: Collection) {
    const dialogData: DeleteEntityDialogData = {
      deleteEntity$: this.collectionService.delete(collection.id),
      entityName: collection.displayName,
    };
    const dialogRef = this.dialogService.open(DeleteEntityDialogComponent, {
      data: dialogData,
    });
    this.archiveCollectionDialogClosed$ = dialogRef.beforeClosed().pipe(
      tap((res) => {
        if (res) {
          this.collectionDeleted$.next(true);
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
      this.createCollection$ = this.collectionService
        .create({
          displayName: collectionDiplayName,
        })
        .pipe(
          switchMap((collection) => {
            return this.flowService.create({
              collectionId: collection.id,
              displayName: 'Flow 1',
            });
          }),
          tap((flow) => {
            this.router.navigate(['/flows/', flow.collectionId], {
              queryParams: { newCollection: true },
            });
          })
        );
    }
  }
  toggleCollectionStatus(
    collectionDto: CollectionListDto,
    control: FormControl<boolean>
  ) {
    if (control.enabled) {
      control.disable();
      this.collectionsUpdateStatusRequest$[collectionDto.id] =
        this.instanceService
          .updateStatus(collectionDto.id, {
            status:
              collectionDto.status === CollectionStatus.ENABLED
                ? InstanceStatus.DISABLED
                : InstanceStatus.ENABLED,
          })
          .pipe(
            tap((res) => {
              control.enable();
              control.setValue(res.status === InstanceStatus.ENABLED);
              this.collectionsUpdateStatusRequest$[collectionDto.id] = null;
              collectionDto.status =
                res.status === InstanceStatus.ENABLED
                  ? CollectionStatus.ENABLED
                  : CollectionStatus.DISABLED;
            }),
            map(() => void 0)
          );
    }
  }
}
