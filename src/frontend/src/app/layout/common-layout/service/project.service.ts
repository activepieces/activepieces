import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Project } from '../model/project.interface';
import { map, Observable, skipWhile, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { ProjectSelectors } from '../store/selector/project.selector';

@Injectable({
	providedIn: 'root',
})
export class ProjectService {
	constructor(private http: HttpClient, private store: Store) {}

	selectedProjectAndTakeOne(): Observable<Project> {
		return this.store.select(ProjectSelectors.selectProject).pipe(
			skipWhile(project => project === undefined),
			take(1),
			map(project => project!)
		);
	}
	create(organisationId: string, request: { displayName }): Observable<Project> {
		return this.http.post<Project>(environment.apiUrl + '/organizations/' + organisationId + '/projects', request);
	}

	update(project: Project): Observable<Project> {
		return this.http.post<Project>(environment.apiUrl + '/projects/' + project.id, project);
	}

	get(projectId: string): Observable<Project> {
		return this.http.get<Project>(environment.apiUrl + '/projects/' + projectId);
	}

	list(organisationId: string): Observable<Project[]> {
		return this.http.get<Project[]>(environment.apiUrl + '/organizations/' + organisationId + '/projects');
	}

	delete(projectId: string): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/projects/' + projectId);
	}
}
