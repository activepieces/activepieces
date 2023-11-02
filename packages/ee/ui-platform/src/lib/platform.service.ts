import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Platform, UpdatePlatformRequestBody } from '@activepieces/ee-shared';
import { environment } from '@activepieces/ui/common';

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
}
