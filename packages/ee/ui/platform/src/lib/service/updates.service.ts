import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

export type VersionRelease = {
  version: string;
  releaseDate: string;
  url: string;
};
@Injectable({
  providedIn: 'root',
})
export class UpdatesService {
  constructor(private http: HttpClient) {}

  getReleaseNotes(): Observable<VersionRelease[]> {
    return this.http
      .get<Record<string, unknown>[]>(
        'https://api.github.com/repos/activepieces/activepieces/releases'
      )
      .pipe(
        map((releases) => {
          const rel: VersionRelease[] = releases
            .filter((release) => !release['prerelease'])
            .map((release) => {
              return {
                version: release['tag_name'],
                releaseDate: release['published_at'],
                url: release['html_url'],
              } as VersionRelease;
            });
          return rel;
        })
      );
  }
}
