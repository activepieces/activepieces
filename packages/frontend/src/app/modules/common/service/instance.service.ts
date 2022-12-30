import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { UUID } from 'angular2-uuid';
import { Instance } from '../model/instance.interface';

@Injectable({
	providedIn: 'root',
})
export class InstanceService {
	constructor(private http: HttpClient) {}

	get(collectionId: UUID): Observable<Instance> {
		return this.http.get<Instance>(environment.apiUrl + `/collections/${collectionId}/instance`);
	}

	delete(instanceId: UUID): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + `/instance/${instanceId}`);
	}
}
