import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {Collection, CollectionVersion} from '../model/collection.interface';
import {Observable} from 'rxjs';
import {SeekPage} from '../model/seek-page';
import {InstanceStatus} from '../model/enum/instance-status';
import {Instance} from '../model/instance.interface';
import {Config} from "../model/fields/variable/config";

@Injectable({
	providedIn: 'root',
})
export class CollectionService {
	constructor(private http: HttpClient) {
	}

	create(collection: { projectId: string, displayName: string; }
	): Observable<Collection> {
		return this.http.post<Collection>(environment.apiUrl +  '/collections', collection);
	}

	update(collectionId: string, updateCollection: {configs: Config[], displayName}): Observable<Collection> {
    return this.http.put<Collection>(environment.apiUrl + '/collections/' + collectionId, updateCollection);
	}

  // TODO REMOVE
	listVersions(collectionId: string): Observable<CollectionVersion[]> {
		return this.http.get<CollectionVersion[]>(environment.apiUrl + '/collections/' + collectionId + '/versions/', {});
	}

	get(collectionId: string): Observable<Collection> {
		return this.http.get<Collection>(environment.apiUrl + '/collections/' + collectionId);
	}

	list(params: { projectId: string; limit: number; cursor: string }): Observable<SeekPage<Collection>> {
		const queryParams: { [key: string]: string | number } = {};
		queryParams['limit'] = params.limit;
    queryParams['projectId'] = params.projectId;
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
