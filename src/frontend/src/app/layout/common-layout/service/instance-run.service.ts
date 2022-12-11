import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { map, Observable, switchMap } from 'rxjs';
import { UUID } from 'angular2-uuid';
import { SeekPage } from './seek-page';
import { InstanceRun, InstanceRunState } from '../model/instance-run.interface';

@Injectable({
	providedIn: 'root',
})
export class InstanceRunService {
	constructor(private http: HttpClient) {}

	get(instanceId: UUID): Observable<InstanceRun> {
		return this.http.get<InstanceRun>(environment.apiUrl + '/instance-runs/' + instanceId).pipe(
			switchMap(instanceRun => {
				return this.logs(instanceRun.logs_file_id).pipe(
					map(state => {
						return { ...instanceRun, state: state };
					})
				);
			})
		);
	}

	list(projectId: UUID): Observable<SeekPage<InstanceRun>> {
		return this.http.get<SeekPage<InstanceRun>>(environment.apiUrl + `/projects/${projectId}/instance-runs`);
	}

	private logs(fileId: UUID): Observable<InstanceRunState> {
		return this.http.get<InstanceRunState>(environment.apiUrl + `/files/${fileId}`);
	}

	count(instanceId: UUID): Observable<number> {
		return this.http.get<number>(environment.apiUrl + '/instances/' + instanceId + '/instance-runs/count');
	}

	emptyPage() {
		return {
			hasMore: false,
			data: [],
		};
	}
}
