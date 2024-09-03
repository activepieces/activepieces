import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ListUserInvitationsRequest,
  SeekPage,
  SendUserInvitationRequest,
  UserInvitation,
  UserInvitationWithLink,
} from '@activepieces/shared';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserInvitationService {
  constructor(private http: HttpClient) { }

  inviteUser(request: SendUserInvitationRequest) {
    return this.http.post<UserInvitationWithLink>(
      `${environment.apiUrl}/user-invitations`,
      request
    );
  }

  list(request: ListUserInvitationsRequest) {
    const params: Record<string, string | number | boolean> = {};
    if (request.projectId) {
      params['projectId'] = request.projectId
    }
    if (request.type) {
      params['type'] = request.type
    }
    if (request.status) {
      params['status'] = request.status
    }
    if (request.limit) {
      params['limit'] = request.limit
    }
    return this.http.get<SeekPage<UserInvitation>>(
      `${environment.apiUrl}/user-invitations`,
      {
        params,
      }
    );
  }

  accept({ invitationToken }: { invitationToken: string }) {
    return this.http.post<{ registered: boolean }>(
      `${environment.apiUrl}/user-invitations/accept`,
      { invitationToken }
    );
  }

  delete(id: string) {
    return this.http.delete<void>(
      `${environment.apiUrl}/user-invitations/${id}`
    );
  }
}
