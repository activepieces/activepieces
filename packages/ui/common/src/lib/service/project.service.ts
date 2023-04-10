import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, map, of, switchMap, take, tap } from 'rxjs';
import { Project } from '@activepieces/shared';
import { Store } from '@ngrx/store';
import { ProjectSelectors } from '../store/project/project.selector';
import { ProjectActions } from '../store/project/project.action';
@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  constructor(private http: HttpClient, private store: Store) {}

  getSelectedProject(): Observable<Project> {
    return this.store.select(ProjectSelectors.selectProject).pipe(
      take(1),
      switchMap((proj) => {
        if (proj) {
          return of(proj);
        }
        return this.list().pipe(
          tap((projects) => {
            this.store.dispatch(
              ProjectActions.setProjects({ projects: projects })
            );
          }),
          map((projects) => projects[0])
        );
      })
    );
  }
  list(): Observable<Project[]> {
    return this.http.get<Project[]>(environment.apiUrl + '/projects');
  }
}
