import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProjectSubscriptionResponse } from '@activepieces/ee-shared';
import { FlagService, environment } from '@activepieces/ui/common';
import { of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  constructor(private http: HttpClient, private flagService: FlagService) {}

  getSubscription() {
    return this.http.get<ProjectSubscriptionResponse>(
      environment.apiUrl + '/project-billing'
    );
  }

  upgrade() {
    return this.http.post<{ paymentLink: string }>(
      environment.apiUrl + '/project-billing/upgrade',
      {}
    );
  }

  checkTeamMembers() {
    return this.flagService.getEdition().pipe(
      switchMap((value) => {
        /*if (value === ApEdition.CLOUD) {
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
        }*/
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
        /*if (value === ApEdition.CLOUD) {
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
        }*/
        return of({
          exceeded: false,
          limit: 99999,
        });
      })
    );
  }
}
