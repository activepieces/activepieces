import { Injectable } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import {
  ApEdition,
  FlowTemplate,
  ListFlowTemplatesRequest,
  SeekPage,
} from '@activepieces/shared';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared';
import { FlagService } from './flag.service';

@Injectable({
  providedIn: 'root',
})
export class TemplatesService {
  constructor(private http: HttpClient, private flagsService: FlagService) {}

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
    let url = environment.apiUrl + '/flow-templates';
    return this.flagsService.getEdition().pipe(
      switchMap((ed) => {
        if (ed === ApEdition.COMMUNITY) {
          url = 'https://cloud.activepieces.com/api/v1/flow-templates';
        }
        return this.http
          .get<SeekPage<FlowTemplate>>(url, {
            params: httpParams,
          })
          .pipe(map((res) => res.data));
      })
    );
  }

  create(request: CreateFlowTemplateRequest): Observable<FlowTemplate> {
    return this.http.post<FlowTemplate>(
      environment.apiUrl + '/flow-templates',
      request
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(environment.apiUrl + `/flow-templates/${id}`);
  }

  getTemplate(flowId: string) {
    return this.http.get<FlowTemplate>(
      environment.apiUrl + `/flow-templates/${flowId}`
    );
  }
}
