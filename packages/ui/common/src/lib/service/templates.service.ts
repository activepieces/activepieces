import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  FlowTemplate,
  ListFlowTemplatesRequest,
  SeekPage,
} from '@activepieces/shared';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared';

@Injectable({
  providedIn: 'root',
})
export class TemplatesService {
  constructor(private http: HttpClient) {}

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
}
