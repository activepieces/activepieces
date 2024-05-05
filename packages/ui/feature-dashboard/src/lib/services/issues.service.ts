import {
  Issue,
  IssueStatus,
  ListIssuesParams,
  UpdateIssueRequestBody,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';
import { environment } from '@activepieces/ui/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class IssuesService {
  constructor(private http: HttpClient) {}

  list(req: ListIssuesParams) {
    const params: Params = {
      projectId: req.projectId,
      cursor: req.cursor,
      limit: req.limit,
    };
    return this.http.get<SeekPage<Issue>>(environment.apiUrl + `/issues`, {
      params,
    });
  }
  resolve(issueId: string) {
    const body: UpdateIssueRequestBody = {
      status: IssueStatus.RESOLEVED,
    };
    return this.http.post<void>(
      environment.apiUrl + `/issues/${issueId}`,
      body
    );
  }
}
