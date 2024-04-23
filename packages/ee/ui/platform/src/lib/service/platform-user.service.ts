import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@activepieces/ui/common';
import { SeekPage, UserResponse } from '@activepieces/shared';
import { UpdateUserRequestBody } from '@activepieces/ee-shared';

@Injectable({
  providedIn: 'root',
})
export class PlatformUserService {
  constructor(private http: HttpClient) {}

  listUsers() {
    return this.http.get<SeekPage<UserResponse>>(`${environment.apiUrl}/users`);
  }

  updateUser(userId: string, request: UpdateUserRequestBody) {
    return this.http.post<void>(
      `${environment.apiUrl}/users/${userId}`,
      request
    );
  }

  deleteUser(userId: string) {
    return this.http.delete<void>(`${environment.apiUrl}/users/${userId}`);
  }
}
