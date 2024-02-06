import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BillingResponse, UpgradeRequest } from '@activepieces/shared';
import { FlagService, environment } from '@activepieces/ui/common';
import { map, of, switchMap } from 'rxjs';
import { ApEdition } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  constructor(private http: HttpClient, private flagService: FlagService) {}

  getUsage() {
    return this.http.get<BillingResponse>(environment.apiUrl + '/billing');
  }

  checkTeamMembers() {
    return this.flagService.getEdition().pipe(
      switchMap((value) => {
        if (value === ApEdition.CLOUD) {
          return this.getUsage().pipe(
            map((usageResponse) => {
              return {
                exceeded:
                  usageResponse.usage.teamMembers >=
                  usageResponse.plan.teamMembers,
                limit: usageResponse.plan.teamMembers,
              };
            })
          );
        }
        return of({
          exceeded: false,
          limit: 99999,
        });
      })
    );
  }

  checkConnectionLimit() {
    return this.flagService.getEdition().pipe(
      switchMap((value) => {
        if (value === ApEdition.CLOUD) {
          return this.getUsage().pipe(
            map((usageResponse) => {
              return {
                exceeded:
                  usageResponse.usage.connections >=
                  usageResponse.plan.connections,
                limit: usageResponse.plan.connections,
              };
            })
          );
        }
        return of({
          exceeded: false,
          limit: 99999,
        });
      })
    );
  }
  upgrade(request: UpgradeRequest) {
    return this.http.post<{ paymentLink: string }>(
      environment.apiUrl + '/billing/upgrade',
      request
    );
  }
}
