import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { CollectionService } from '../../common/service/collection.service';
import { ProjectService } from '../../common/service/project.service';
import { DEFAULT_PAGE_SIZE } from '../../../../../../ui/common/src/lib/tables.utils';

@Injectable({
  providedIn: 'root',
})
export class AreThereCollectionsResovler
  implements Resolve<Observable<boolean>>
{
  constructor(
    private projectService: ProjectService,
    private collectionService: CollectionService
  ) {}

  resolve(): Observable<boolean> {
    return this.projectService.selectedProjectAndTakeOne().pipe(
      switchMap((project) => {
        return this.collectionService
          .list({ projectId: project.id, limit: DEFAULT_PAGE_SIZE, cursor: '' })
          .pipe(
            map((res) => {
              return res.data.length > 0;
            })
          );
      })
    );
  }
}
