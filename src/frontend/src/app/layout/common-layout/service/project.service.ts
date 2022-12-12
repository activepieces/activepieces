import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Project } from '../model/project.interface';
import { map, Observable, of, switchMap, take, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { ProjectSelectors } from '../store/selector/project.selector';
import { ProjectActions } from '../store/action/project.action';

@Injectable({
	providedIn: 'root',
})
export class ProjectService {
	constructor(private http: HttpClient, private store: Store) {}

	selectedProjectAndTakeOne(): Observable<Project> {
		return this.store.select(ProjectSelectors.selectProject).pipe(
			take(1),
			switchMap(project => {
				if (project) return of(project);
				return this.list().pipe(
					tap(projects => {
						this.store.dispatch(ProjectActions.setProjects({ projects: projects }));
					}),
					map(projects => projects[0])
				);
			})
		);
	}

	update(project: Project): Observable<Project> {
		return this.http.post<Project>(environment.apiUrl + '/projects/' + project.id, project);
	}

	get(projectId: string): Observable<Project> {
		return this.http.get<Project>(environment.apiUrl + '/projects/' + projectId);
	}

	list(): Observable<Project[]> {
		return this.http.get<Project[]>(environment.apiUrl + '/projects');
	}
  
}
