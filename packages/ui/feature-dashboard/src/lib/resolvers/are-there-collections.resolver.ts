import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { CollectionService, ProjectService } from '@activepieces/ui/common';
import { DEFAULT_PAGE_SIZE } from '@activepieces/ui/common';
export const ARE_THERE_COLLECTIONS_FLAG = 'areThereCollections';
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
    return this.projectService.getSelectedProject().pipe(
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
