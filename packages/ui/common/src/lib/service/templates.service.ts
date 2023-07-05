import { Injectable } from '@angular/core';
import { map, switchMap } from 'rxjs';
import { FlowTemplate, ListFlowTemplatesRequest } from '@activepieces/shared';
import { FlagService } from './flag.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';

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
    }).pipe(
      map((res) => {
        return res.sort((a, b) =>
          (a.pinnedOrder || 0) > (b.pinnedOrder || 0) ? 1 : -1
        );
      })
    );
  }
  getTemplates(params: ListFlowTemplatesRequest) {
    let httpParams = new HttpParams();
    if (params.pieces && params.pieces.length > 0) {
      httpParams = httpParams.appendAll({ pieces: params.pieces });
    }
    if (params.tags && params.tags.length > 0) {
      httpParams = httpParams.appendAll({ tags: params.tags });
    }
    if (params.search) {
      httpParams = httpParams.append('search', params.search);
    }
    if (params.pinned !== undefined) {
      httpParams = httpParams.append('pinned', params.pinned ? true : false);
    }
    return this.flagsService.getTemplatesSourceUrl().pipe(
      switchMap((url) => {
        return this.http.get<FlowTemplate[]>(url, { params: httpParams });
      })
    );
  }
  getTemplate(flowId: string) {
    return this.http.get<FlowTemplate>(
      environment.apiUrl + `/flow-templates/${flowId}`
    );
  }
  getTemplateDeprecated(templateId: string) {
    return this.http.get<FlowTemplate>(
      `https://activepieces-cdn.fra1.cdn.digitaloceanspaces.com/templates/${templateId}.json`
    );
  }
}
