import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, map } from 'rxjs';
import { Project, SeekPage } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  constructor(private http: HttpClient) {}

  list(): Observable<Project[]> {
    return this.http
      .get<SeekPage<Project>>(environment.apiUrl + `/users/projects`)
      .pipe(map((res) => res.data));
  }
}
