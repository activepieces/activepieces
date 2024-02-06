import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@activepieces/ui/common';
import {
  AcceptInvitationRequest,
  AcceptProjectResponse,
  ListProjectMembersRequestQuery,
  ProjectMember,
  AddProjectMemberRequestBody,
} from '@activepieces/shared';
import { SeekPage } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class ProjectMemberService {
  constructor(private http: HttpClient) {}

  accept(request: AcceptInvitationRequest): Observable<AcceptProjectResponse> {
    return this.http.post<AcceptProjectResponse>(
      environment.apiUrl + '/project-members/accept',
      request
    );
  }

  invite(request: AddProjectMemberRequestBody): Observable<void> {
    return this.http.post<void>(
      environment.apiUrl + '/project-members',
      request
    );
  }

  delete(invitationId: string): Observable<void> {
    return this.http.delete<void>(
      environment.apiUrl + '/project-members/' + invitationId
    );
  }

  list(
    request: ListProjectMembersRequestQuery
  ): Observable<SeekPage<ProjectMember>> {
    const queryParams: { [key: string]: string | number } = {
      limit: request.limit ?? 10,
      cursor: request.cursor || '',
      projectId: request.projectId,
    };
    return this.http.get<SeekPage<ProjectMember>>(
      environment.apiUrl + '/project-members',
      {
        params: queryParams,
      }
    );
  }
}
