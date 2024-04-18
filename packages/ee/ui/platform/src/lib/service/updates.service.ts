import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UpdatesService {
  constructor(private http: HttpClient) {}
  getReleaseNotes() {
    return this.http.get<{
      [key: string]: string | { [key: string]: string } | string[] | number;
    }>(
      'https://api.github.com/repos/activepieces/activepieces/releases/latest'
    );
  }
}
