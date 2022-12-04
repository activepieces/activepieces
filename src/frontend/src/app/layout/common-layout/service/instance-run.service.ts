import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { map, Observable, of, switchMap } from 'rxjs';
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
				if (!instanceRun.state && instanceRun.stateUrl) {
					return this.logs(instanceRun.stateUrl).pipe(
						map(st => {
							instanceRun.state = st;
							return instanceRun;
						})
					);
				}
				return of(instanceRun);
			})
		);
	}

	list(environmentId: UUID, params: any): Observable<SeekPage<InstanceRun>> {
		return this.http.get<SeekPage<InstanceRun>>(
			environment.apiUrl + '/environments/' + environmentId + '/instance-runs',
			{ params: params }
		);
	}

	private logs(url: string): Observable<InstanceRunState> {
		return this.http.get<InstanceRunState>(url);
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
