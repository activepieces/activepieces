import { Injectable } from '@angular/core';
import { SyncProjectService } from '../services/sync-project.service';
import { catchError, map, Observable, of } from 'rxjs';
import { GitRepo } from '@activepieces/ee-shared';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

export const ARE_THERE_FLOWS_FLAG = 'areThererFlows';
@Injectable({
  providedIn: 'root',
})
export class RepoResolver {
  constructor(private syncProjectService: SyncProjectService) {}

  resolve(): Observable<GitRepo | undefined> {
    return this.syncProjectService.list().pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === HttpStatusCode.NotFound) {
          return of([]);
        }
        throw err;
      }),
      map((res) => {
        return res[0];
      })
    );
  }
}
