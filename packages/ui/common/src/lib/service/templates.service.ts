import { Injectable } from '@angular/core';
import { map, switchMap } from 'rxjs';
import { FlowTemplate, ListFlowTemplatesRequest } from '@activepieces/shared';
import { FlagService } from './flag.service';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TemplatesService {
  constructor(private flagsService: FlagService, private http: HttpClient) {}
  getPinnedTemplates() {
    return this.getTemplates({
      pieces: [],
      tags: [],
      search: '',
      pinned: true,
    });
  }
  getTemplates(params: ListFlowTemplatesRequest) {
    const httpParams = new HttpParams();
    if (params.pieces && params.pieces.length > 0) {
      params.pieces.forEach((piece) => {
        httpParams.append('pieces', piece);
      });
    }
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach((tag) => {
        httpParams.append('tags', tag);
      });
    }
    if (params.search) {
      httpParams.append('search', params.search);
    }
    if (params.pinned !== undefined) {
      httpParams.append('pinned', params.pinned.toString());
    }
    return this.flagsService.getTemplatesSourceUrl().pipe(
      switchMap((url) => {
        return this.http.get<FlowTemplate[]>(url, { params: httpParams });
      }),
      map((res) => {
        return [...res];
      })
    );
  }
}
