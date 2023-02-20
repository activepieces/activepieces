import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, tap } from 'rxjs';
import {
	Collection,
	SeekPage,
	UpdateCollectionRequest,
	CollectionId,
	CreateCollectionRequest,
	TelemetryEventName,
} from '@activepieces/shared';
import { TelemetryService } from './telemetry.service';

@Injectable({
	providedIn: 'root',
})
export class CollectionService {
	constructor(private http: HttpClient, private posthogService: TelemetryService) { }

	create(request: CreateCollectionRequest): Observable<Collection> {
		return this.http.post<Collection>(environment.apiUrl + '/collections', request).pipe(tap(collection => {
			this.posthogService.captureEvent({
				name: TelemetryEventName.COLLECTION_CREATED,
				payload: {
					collectionId: collection.id,
					projectId: collection.projectId
				}
			});
		}));
	}

	update(collectionId: CollectionId, request: UpdateCollectionRequest): Observable<Collection> {
		return this.http.post<Collection>(environment.apiUrl + '/collections/' + collectionId, request);
	}

	get(collectionId: string): Observable<Collection> {
		return this.http.get<Collection>(environment.apiUrl + '/collections/' + collectionId);
	}

	list(params: { projectId: string; limit: number; cursor: string }): Observable<SeekPage<Collection>> {
		const queryParams: { [key: string]: string | number } = {
			limit: params.limit,
			projectId: params.projectId,
		};
		if (params.cursor) {
			queryParams['cursor'] = params.cursor;
		}
		return this.http.get<SeekPage<Collection>>(environment.apiUrl + '/collections', {
			params: queryParams,
		});
	}

	delete(collectionId: string): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + '/collections/' + collectionId);
	}
}
