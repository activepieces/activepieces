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
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class IssuesService {
  private checkIssuesCount$ = new BehaviorSubject(null);
  private shouldShowIssuesNotificationIconInSidebar$ = new BehaviorSubject(
    false
  );
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
  getIssuesCount() {
    return this.http.get<number>(environment.apiUrl + `/issues/count`);
  }

  refreshIssuesCount() {
    this.checkIssuesCount$.next(null);
  }

  get shouldRefreshIssuesCount$() {
    return this.checkIssuesCount$.asObservable();
  }
  toggleShowIssuesNotificationIconInSidebar(val: boolean) {
    this.shouldShowIssuesNotificationIconInSidebar$.next(val);
  }
  get shouldShowIssuesNotificationIconInSidebarObs$() {
    return this.shouldShowIssuesNotificationIconInSidebar$.asObservable();
  }
}
