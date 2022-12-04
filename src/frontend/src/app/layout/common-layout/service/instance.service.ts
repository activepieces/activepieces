import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { UUID } from 'angular2-uuid';
import { SeekPage } from './seek-page';
import { Instance } from '../model/instance.interface';
import { InstanceStatus } from '../model/enum/instance-status';

@Injectable({
	providedIn: 'root',
})
export class InstanceService {
	constructor(private http: HttpClient) {}

	create(request: {
		status: InstanceStatus;
		accountId: UUID;
		collectionVersionId: UUID;
		configs: any;
	}): Observable<Instance> {
		return this.http.post<Instance>(environment.apiUrl + '/instances', request);
	}

	get(instanceId: UUID): Observable<Instance> {
		return this.http.get<Instance>(environment.apiUrl + '/instances/' + instanceId);
	}

	list(environmentId: UUID, params: any): Observable<SeekPage<Instance>> {
		return this.http.get<SeekPage<Instance>>(environment.apiUrl + '/environments/' + environmentId + '/instances', {
			params: params,
		});
	}

	delete(instanceId: UUID): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/instances/' + instanceId);
	}

	countByAccountId(accountId: UUID): Observable<number> {
		return this.http.get<number>(environment.apiUrl + '/accounts/' + accountId + '/instances/count');
	}
}
