import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import {
  Platform,
  SeekPage,
  UpdatePlatformRequestBody,
  UserResponse,
  UserStatus,
} from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  constructor(private http: HttpClient) {}

  updatePlatform(req: UpdatePlatformRequestBody, platformId: string) {
    return this.http.post<void>(
      `${environment.apiUrl}/platforms/${platformId}`,
      req
    );
  }
  getPlatform(platformId: string) {
    return this.http.get<Platform>(
      `${environment.apiUrl}/platforms/${platformId}`
    );
  }
  listUsers() {
    return this.http.get<SeekPage<UserResponse>>(`${environment.apiUrl}/users`);
  }

  updateUser(userId: string, { status }: { status: UserStatus }) {
    return this.http.post<void>(`${environment.apiUrl}/users/${userId}`, {
      status,
    });
  }

  deleteUser(userId: string) {
    return this.http.delete<void>(`${environment.apiUrl}/users/${userId}`);
  }
}
