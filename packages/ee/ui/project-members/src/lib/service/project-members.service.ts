import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import {
  AuthenticationService,
  DEFAULT_PAGE_SIZE,
  ProjectService,
  environment,
} from '@activepieces/ui/common';
import {
  AcceptInvitationRequest,
  AcceptProjectResponse,
  ListProjectMembersRequestQuery,
  ProjectMember,
  AddProjectMemberRequestBody,
} from '@activepieces/ee-shared';
import { ProjectMemberRole, SeekPage } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class ProjectMemberService {
  private role$: Observable<ProjectMemberRole | null>;

  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService,
    private projectService: ProjectService
  ) {
    this.role$ = combineLatest({
      project: this.projectService.currentProject$,
      user: this.authenticationService.currentUserSubject,
    }).pipe(
      switchMap(({ project, user }) => {
        if (!project || !user) {
          return of(null);
        }
        if (project.ownerId === user.id) {
          return of(ProjectMemberRole.ADMIN);
        }
        return this.list({ projectId: project.id }).pipe(
          map((members) => {
            const member = members.data.find((m) => m.email === user.email);
            return member?.role ?? null;
          })
        );
      })
    );
  }

  isRole(projectRole: ProjectMemberRole): Observable<boolean> {
    return this.role$.pipe(map((role) => role === projectRole));
  }

  role(): Observable<ProjectMemberRole | null> {
    return this.role$;
  }

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
      limit: request.limit ?? DEFAULT_PAGE_SIZE,
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
