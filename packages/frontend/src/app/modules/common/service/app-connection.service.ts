import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { SeekPage, AppConnectionId, ListAppConnectionRequest, AppConnection, UpsertConnectionRequest } from 'shared';

@Injectable({
	providedIn: 'root',
})
export class AppConnectionService {
	constructor(private http: HttpClient) {}

	upsert(request: UpsertConnectionRequest): Observable<AppConnection> {
		return this.http.post<AppConnection>(environment.apiUrl + '/app-connections', request);
	}

	list(params: ListAppConnectionRequest): Observable<SeekPage<AppConnection>> {
		const queryParams: { [key: string]: string | number } = {
			projectId: params.projectId,
		};
		if (params.cursor) {
			queryParams['cursor'] = params.cursor;
		}
		return this.http.get<SeekPage<AppConnection>>(environment.apiUrl + '/app-connections', {
			params: queryParams,
		});
	}

	delete(id: AppConnectionId): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/app-connections/' + id);
	}
}
