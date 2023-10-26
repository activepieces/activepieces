import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@activepieces/ui/common';
import { SeekPage } from '@activepieces/shared';
import { ListReferralsRequest, Referral } from '@activepieces/ee-shared';

@Injectable({
  providedIn: 'root',
})
export class ReferralService {
  constructor(private http: HttpClient) {}

  list(request: ListReferralsRequest): Observable<SeekPage<Referral>> {
    const queryParams: { [key: string]: string | number } = {
      limit: request.limit ?? 10,
      cursor: request.cursor || '',
    };
    return this.http.get<SeekPage<Referral>>(
      environment.apiUrl + '/referrals',
      {
        params: queryParams,
      }
    );
  }
}
