import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { CollectionId, Instance, InstanceId, TelemetryEventName, UpsertInstanceRequest } from '@activepieces/shared';
import { TelemetryService } from './telemetry.service';

@Injectable({
	providedIn: 'root',
})
export class InstanceService {
	constructor(private http: HttpClient, private posthogService: TelemetryService) { }

	publish(request: UpsertInstanceRequest): Observable<Instance> {
		return this.http.post<Instance>(environment.apiUrl + `/instances`, request).pipe(tap(instance => {
			this.posthogService.captureEvent({
				name: TelemetryEventName.COLLECTION_ENABLED,
				payload: {
					collectionId: instance.collectionId,
					projectId: instance.projectId
				}
			});
		}));
	}

	get(collectionId: CollectionId): Observable<Instance> {
		return this.http.get<Instance>(environment.apiUrl + `/instances`, {
			params: {
				collectionId: collectionId,
			},
		});
	}

	delete(instanceId: InstanceId): Observable<void> {
		return this.http.delete<void>(environment.apiUrl + `/instances/${instanceId}`);
	}
}
