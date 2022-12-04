import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { SeekPage } from './seek-page';
import { EventDefinition } from '../model/event.-definition.interface';

@Injectable({
	providedIn: 'root',
})
export class EventDefinitionService {
	constructor(private http: HttpClient) {}

	create(
		projectId: string,
		request: { name: string; displayName: string; hidden: boolean; description: string }
	): Observable<EventDefinition> {
		return this.http.post<EventDefinition>(
			environment.apiUrl + '/projects/' + projectId + '/event-definitions',
			request
		);
	}

	update(request: {
		id: string;
		displayName: string;
		hidden: boolean;
		description: string;
	}): Observable<EventDefinition> {
		return this.http.post<EventDefinition>(environment.apiUrl + '/event-definitions/' + request.id, request);
	}

	get(eventId: string): Observable<EventDefinition> {
		return this.http.get<EventDefinition>(environment.apiUrl + '/event-definitions/' + eventId);
	}

	list(projectId: string, limit: number): Observable<SeekPage<EventDefinition>> {
		return this.http.get<SeekPage<EventDefinition>>(
			environment.apiUrl + '/projects/' + projectId + '/event-definitions?limit=' + limit
		);
	}
}
