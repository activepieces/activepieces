import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, map } from 'rxjs';
import { ProjectWithLimits, SeekPage } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  constructor(private http: HttpClient) {}

  list(): Observable<ProjectWithLimits[]> {
    return this.http
      .get<SeekPage<ProjectWithLimits>>(environment.apiUrl + `/users/projects`)
      .pipe(map((res) => res.data));
  }
}
