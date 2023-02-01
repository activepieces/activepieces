import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { SeekPage, AppConnectionId, AppConnection, UpsertConnectionRequest, ListAppConnectionRequest } from '@activepieces/shared';

@Injectable({
	providedIn: 'root',
})
export class AppConnectionsService {
	constructor(private http: HttpClient) {}

	upsert(request: UpsertConnectionRequest): Observable<AppConnection> {
		return this.http.post<AppConnection>(environment.apiUrl + '/app-connections', request);
	}

	list(params: ListAppConnectionRequest): Observable<SeekPage<AppConnection>> {
		const queryParams: { [key: string]: string | number } = {};
		if (params.cursor) {
			queryParams['cursor'] = params.cursor;
		}
		if(params.limit)
		{
			queryParams['limit']=params.limit;
		}
		return this.http.get<SeekPage<AppConnection>>(environment.apiUrl + '/app-connections', {
			params: queryParams,
		});
	}

	delete(id: AppConnectionId): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/app-connections/' + id);
	}
}
