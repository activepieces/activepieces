import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { UUID } from 'angular2-uuid';
import { SeekPage } from './seek-page';
import { ApiKey } from '../model/api-key.interface';

@Injectable({
	providedIn: 'root',
})
export class ApiKeyService {
	constructor(private http: HttpClient) {}

	create(projectId: UUID, request: { name: string }): Observable<ApiKey> {
		return this.http.post<ApiKey>(environment.apiUrl + '/projects/' + projectId + '/api-keys', request);
	}

	update(apiKeyId: UUID, request: { name: string }): Observable<ApiKey> {
		return this.http.post<ApiKey>(environment.apiUrl + '/api-keys/' + apiKeyId, request);
	}

	get(apiKeyId: string): Observable<ApiKey> {
		return this.http.get<ApiKey>(environment.apiUrl + '/api-keys/' + apiKeyId);
	}

	list(projectId: string, limit: number): Observable<SeekPage<ApiKey>> {
		return this.http.get<SeekPage<ApiKey>>(environment.apiUrl + '/projects/' + projectId + '/api-keys?limit=' + limit);
	}

	delete(apiKeyId: UUID): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/api-keys/' + apiKeyId);
	}
}
