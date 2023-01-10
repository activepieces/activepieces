import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import {
	AppCredential,
	AppCredentialId,
	ListAppRequest,
	SeekPage,
	UpsertAppCredentialsRequest,
} from 'shared';

@Injectable({
	providedIn: 'root',
})
export class AppCredentialService {
	constructor(private http: HttpClient) { }

	upsert(request: UpsertAppCredentialsRequest): Observable<AppCredential> {
		return this.http.post<AppCredential>(environment.apiUrl + '/app-credentials', request);
	}

	list(params: ListAppRequest): Observable<SeekPage<AppCredential>> {
		const queryParams: { [key: string]: string | number } = {
			projectId: params.projectId,
		};
		if (params.cursor) {
			queryParams['cursor'] = params.cursor;
		}
		return this.http.get<SeekPage<AppCredential>>(environment.apiUrl + '/app-credentials', {
			params: queryParams,
		});
	}

	delete(id: AppCredentialId): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/app-credentials/' + id);
	}
}
