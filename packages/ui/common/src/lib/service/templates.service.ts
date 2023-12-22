import { Injectable } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import {
  FlowTemplate,
  ListFlowTemplatesRequest,
  SeekPage,
} from '@activepieces/shared';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import dayjs from 'dayjs';
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared';

@Injectable({
  providedIn: 'root',
})
export class TemplatesService {
  constructor(private http: HttpClient) {}
  getFeaturedTemplates() {
    return this.list({
      pieces: [],
      tags: [],
      search: '',
      featuredOnly: true,
    }).pipe(
      map((res) => {
        return res.sort((a, b) =>
          new Date(a.created) > new Date(b.created) ? 1 : -1
        );
      }),
      shareReplay(1)
    );
  }
  list(params: ListFlowTemplatesRequest): Observable<FlowTemplate[]> {
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
    if (params.featuredOnly !== undefined) {
      httpParams = httpParams.append(
        'featuredOnly',
        params.featuredOnly ? true : false
      );
    }
    httpParams.append('limit', '1000');
    return this.http
      .get<SeekPage<FlowTemplate>>(environment.apiUrl + '/flow-templates', {
        params: httpParams,
      })
      .pipe(map((res) => res.data));
  }

  create(request: CreateFlowTemplateRequest): Observable<FlowTemplate> {
    return this.http.post<FlowTemplate>(
      environment.apiUrl + '/flow-templates',
      request
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

  getIsThereNewFeaturedTemplates() {
    return this.getFeaturedTemplates().pipe(
      map((res) => {
        return (
          res.filter((template) => {
            return dayjs(template.created).isAfter(dayjs().subtract(7, 'days'));
          }).length > 0
        );
      })
    );
  }
}
