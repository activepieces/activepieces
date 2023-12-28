import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Platform, UpdatePlatformRequestBody } from '@activepieces/ee-shared';
import { environment } from '../environments/environment';
import { SeekPage, UserResponse } from '@activepieces/shared';

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
  suspendUser(userId: string) {
    return this.http.post<void>(
      `${environment.apiUrl}/users/${userId}/suspend`,
      {}
    );
  }
  activateUser(userId: string) {
    return this.http.post<void>(
      `${environment.apiUrl}/users/${userId}/activate`,
      {}
    );
  }
}
