import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  FlagService,
  ProjectSelectors,
  environment,
} from '@activepieces/ui/common';
import { combineLatest, map } from 'rxjs';
import { Store } from '@ngrx/store';
import { ApEdition } from '@activepieces/shared';
import { ProjectBillingRespone } from '@activepieces/ee-shared';

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  constructor(
    private http: HttpClient,
    private flagService: FlagService,
    private store: Store
  ) {}

  getSubscription() {
    return this.http.get<ProjectBillingRespone>(
      environment.apiUrl + '/project-billing'
    );
  }

  upgrade() {
    return this.http.post<{ paymentLink: string }>(
      environment.apiUrl + '/project-billing/upgrade',
      {}
    );
  }

  portalLink() {
    return this.http.post<{ portalLink: string }>(
      environment.apiUrl + '/project-billing/portal',
      {}
    );
  }

  checkTeamMembers() {
    return combineLatest([
      this.flagService.getEdition(),
      this.store.select(ProjectSelectors.selectCurrentProject),
    ]).pipe(
      map(([value, project]) => {
        if (value === ApEdition.CLOUD) {
          return {
            exceeded: project?.usage.teamMembers >= project?.plan?.teamMembers,
            limit: project?.plan?.teamMembers,
          };
        }
        return {
          exceeded: false,
          limit: Number.MAX_SAFE_INTEGER,
        };
      })
    );
  }
}
