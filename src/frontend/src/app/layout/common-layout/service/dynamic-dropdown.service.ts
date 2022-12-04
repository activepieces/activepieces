import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DynamicDropdownResult } from '../model/dynamic-controls/dynamic-dropdown-result';

@Injectable({
	providedIn: 'root',
})
export class DynamicDropdownService {
	refreshersListenerIsReadySubject: Subject<string> = new Subject();

	constructor(private http: HttpClient) {}

	refreshCollectionDynamicDropdownConfig(collectionVersionId: UUID, configKey: string, payload: any) {
		payload = { configs: payload };
		return this.http.post<DynamicDropdownResult>(
			environment.apiUrl + `/collection-versions/${collectionVersionId.toString()}/config/${configKey}/refresh`,
			payload
		);
	}

	refreshFlowDynamicDropdownConfig(flowVersionId: UUID, configKey: string, payload: any) {
		payload = { configs: payload };
		return this.http.post<DynamicDropdownResult>(
			environment.apiUrl + `/flow-versions/${flowVersionId.toString()}/config/${configKey}/refresh`,
			payload
		);
	}
}
