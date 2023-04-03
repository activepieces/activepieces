import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment';
import { Observable } from 'rxjs';
import {
  Collection,
  SeekPage,
  UpdateCollectionRequest,
  CollectionId,
  CreateCollectionRequest,
  CollectionListDto,
} from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  constructor(private http: HttpClient) {}

  create(request: CreateCollectionRequest): Observable<Collection> {
    return this.http.post<Collection>(
      environment.apiUrl + '/collections',
      request
    );
  }

  update(
    collectionId: CollectionId,
    request: UpdateCollectionRequest
  ): Observable<Collection> {
    return this.http.post<Collection>(
      environment.apiUrl + '/collections/' + collectionId,
      request
    );
  }

  get(collectionId: string): Observable<Collection> {
    return this.http.get<Collection>(
      environment.apiUrl + '/collections/' + collectionId
    );
  }

  list(params: {
    projectId: string;
    limit: number;
    cursor: string;
  }): Observable<SeekPage<CollectionListDto>> {
    const queryParams: { [key: string]: string | number } = {
      limit: params.limit,
      projectId: params.projectId,
    };
    if (params.cursor) {
      queryParams['cursor'] = params.cursor;
    }
    return this.http.get<SeekPage<CollectionListDto>>(
      environment.apiUrl + '/collections',
      {
        params: queryParams,
      }
    );
  }

  delete(collectionId: string): Observable<void> {
    return this.http.delete<void>(
      environment.apiUrl + '/collections/' + collectionId
    );
  }
}
