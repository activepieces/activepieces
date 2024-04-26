import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateUserRequestBody, SeekPage, UpdateUserRequestBody, User, UserResponse } from '@activepieces/shared';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PlatformUserService {
  constructor(private http: HttpClient) { }

  createUser(request: CreateUserRequestBody) : Observable<User>{
    return this.http.post<User>(`${environment.apiUrl}/users`, request);
  }

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
