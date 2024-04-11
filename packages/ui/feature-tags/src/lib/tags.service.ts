import { UpsertTagRequest, ListTagsRequest, SeekPage, SetPieceTagsRequest, Tag } from "@activepieces/shared";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from '@activepieces/ui/common'

@Injectable({
    providedIn: 'root',
})
export class TagsService {

    constructor(private http: HttpClient) { }

    upsert(tag: UpsertTagRequest): Observable<Tag> {
        return this.http.post<Tag>(`${environment.apiUrl}/tags`, tag);
    }
    
    list(query: ListTagsRequest): Observable<SeekPage<Tag>> {
        return this.http.get<SeekPage<Tag>>(`${environment.apiUrl}/tags`, { params: query });
    }

    tagPieces(request: SetPieceTagsRequest): Observable<void> {
        return this.http.post<void>(`${environment.apiUrl}/tags/pieces`, request);
    }

}

