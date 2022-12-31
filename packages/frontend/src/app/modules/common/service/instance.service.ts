import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { Instance } from 'shared';

@Injectable({
	providedIn: 'root',
})
export class InstanceService {
	constructor(private http: HttpClient) {}

	get(collectionId: string): Observable<Instance> {
		return this.http.get<Instance>(environment.apiUrl + `/instance`, {
			params: {
				collectionId: collectionId
			}
		});
	}

	delete(instanceId: string): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + `/instance/${instanceId}`);
	}
}
