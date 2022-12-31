import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Observable} from 'rxjs';
import { InstanceStatus, Collection, CollectionVersion, SeekPage, Instance, UpdateCollectionRequest, CollectionId, CreateCollectionRequest} from 'shared';

@Injectable({
	providedIn: 'root',
})
export class CollectionService {
	constructor(private http: HttpClient) {
	}

	create(request: CreateCollectionRequest
	): Observable<Collection> {
		return this.http.post<Collection>(environment.apiUrl +  '/collections', request);
	}

	update(collectionId: CollectionId, request: UpdateCollectionRequest): Observable<Collection> {
    return this.http.post<Collection>(environment.apiUrl + '/collections/' + collectionId, request);
	}

  // TODO REMOVE
	listVersions(collectionId: string): Observable<CollectionVersion[]> {
		return this.http.get<CollectionVersion[]>(environment.apiUrl + '/collections/' + collectionId + '/versions/', {});
	}

	get(collectionId: string): Observable<Collection> {
		return this.http.get<Collection>(environment.apiUrl + '/collections/' + collectionId);
	}

	list(params: { projectId: string; limit: number; cursor: string }): Observable<SeekPage<Collection>> {
		const queryParams: { [key: string]: string | number } = {
			limit: params.limit,
			projectId: params.projectId
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

  // TODO FIX
	deploy(collectionId: string): Observable<Instance> {
		return this.http.post<Instance>(environment.apiUrl + `/collections/${collectionId}/instance`, {
			status: InstanceStatus.ENABLED,
		});
	}
}
