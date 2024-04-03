import { ListTagsRequest, SeekPage, Tag } from "@activepieces/shared";
import { environment } from "@activepieces/ui/common";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject, map, of, shareReplay } from "rxjs";


@Injectable({
    providedIn: 'root',
})
export class TagsService {

    constructor(private http: HttpClient) { }

    list(query: ListTagsRequest): Observable<SeekPage<Tag>> {
        return this.http.get<SeekPage<Tag>>(`${environment.apiUrl}/tags`, { params: query });
    }


}

