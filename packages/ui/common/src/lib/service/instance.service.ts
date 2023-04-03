import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment';
import { Observable } from 'rxjs';
import {
  CollectionId,
  Instance,
  InstanceId,
  UpdateInstanceRequest,
  UpsertInstanceRequest,
} from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class InstanceService {
  constructor(private http: HttpClient) {}

  publish(request: UpsertInstanceRequest): Observable<Instance> {
    return this.http.post<Instance>(environment.apiUrl + `/instances`, request);
  }

  updateStatus(
    collectionId: CollectionId,
    request: UpdateInstanceRequest
  ): Observable<Instance> {
    return this.http.post<Instance>(
      environment.apiUrl + `/instances/` + collectionId,
      request
    );
  }

  get(collectionId: CollectionId): Observable<Instance> {
    return this.http.get<Instance>(environment.apiUrl + `/instances`, {
      params: {
        collectionId: collectionId,
      },
    });
  }

  delete(instanceId: InstanceId): Observable<void> {
    return this.http.delete<void>(
      environment.apiUrl + `/instances/${instanceId}`
    );
  }
}
