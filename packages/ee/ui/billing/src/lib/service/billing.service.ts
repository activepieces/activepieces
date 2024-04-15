import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  FlagService,
  ProjectService,
  environment,
} from '@activepieces/ui/common';
import { combineLatest, map } from 'rxjs';
import { ApEdition, assertNotNullOrUndefined } from '@activepieces/shared';
import { ProjectBillingResponse } from '@activepieces/ee-shared';

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  constructor(
    private http: HttpClient,
    private flagService: FlagService,
    private projectService: ProjectService
  ) {}

  getSubscription() {
    return this.http.get<ProjectBillingResponse>(
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
      this.projectService.currentProject$,
    ]).pipe(
      map(([value, project]) => {
        if (value === ApEdition.CLOUD) {
          assertNotNullOrUndefined(project, 'project is null');
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
