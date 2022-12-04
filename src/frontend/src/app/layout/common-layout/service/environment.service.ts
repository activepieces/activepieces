import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ProjectEnvironment } from '../model/project-environment.interface';
import { BehaviorSubject, Observable, of, switchMap, take } from 'rxjs';
import { UUID } from 'angular2-uuid';
import { SeekPage } from './seek-page';
import { ProjectService } from './project.service';
import { ActivatedRoute } from '@angular/router';

@Injectable({
	providedIn: 'root',
})
export class EnvironmentService {
	constructor(private projectService: ProjectService, private actRoute: ActivatedRoute, private http: HttpClient) {
		this.actRoute.queryParams.subscribe(value => {});
	}

	private _selectedEnvironment: BehaviorSubject<ProjectEnvironment | undefined> = new BehaviorSubject<
		ProjectEnvironment | undefined
	>(undefined);

	cachedSelectedEnvironment(): Observable<ProjectEnvironment | undefined> {
		return this._selectedEnvironment.pipe();
	}

	selectedEnvironment(environmentName: string | null): Observable<ProjectEnvironment | undefined> {
		if (this._selectedEnvironment.value && this._selectedEnvironment.value?.name === environmentName) {
			return this._selectedEnvironment.pipe(take(1));
		}
		return this.projectService.selectedProjectAndTakeOne().pipe(
			switchMap(project =>
				this.list(project.id, 9999).pipe(
					switchMap(environments => {
						for (let i = 0; i < environments.data.length; ++i) {
							if (environments.data[i].name === environmentName) {
								this._selectedEnvironment.next(environments.data[i]);
								return of(environments.data[i]);
							}
						}
						this._selectedEnvironment.next(environments.data[0]);
						return of(environments.data[0]);
					})
				)
			)
		);
	}

	create(projectId: UUID, request: { name: string; deployedPieces: any[] }): Observable<ProjectEnvironment> {
		return this.http.post<ProjectEnvironment>(environment.apiUrl + '/projects/' + projectId + '/environments', request);
	}

	publish(environmentId: UUID, request: { collectionVersionId: UUID }): Observable<ProjectEnvironment> {
		return this.http.post<ProjectEnvironment>(
			environment.apiUrl + '/environments/' + environmentId + '/publish',
			request
		);
	}

	get(environmentId: string): Observable<ProjectEnvironment> {
		return this.http.get<ProjectEnvironment>(environment.apiUrl + '/environments/' + environmentId);
	}

	list(projectId: string, limit: number): Observable<SeekPage<ProjectEnvironment>> {
		return this.http
			.get<SeekPage<ProjectEnvironment>>(environment.apiUrl + '/projects/' + projectId + '/environments?limit=' + limit)
			.pipe(
				switchMap(seekPage => {
					if (seekPage.data.length > 0) {
						return of(seekPage);
					}
					return this.create(projectId, { name: 'production', deployedPieces: [] }).pipe(
						switchMap(value => {
							seekPage.data.push(value);
							return of(seekPage);
						})
					);
				})
			);
	}

	delete(environmentId: string): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/environments/' + environmentId);
	}
}
