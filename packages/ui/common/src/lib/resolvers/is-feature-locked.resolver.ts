import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { Observable } from 'rxjs';
import { PlatformService } from '../service';
export const SIGNING_KEY_DISABLED_RESOLVER_KEY = 'signingKeyDisabled';
export const APPEARANCE_DISABLED_RESOLVER_KEY = 'appearanceDisabled';
export const MANAGE_PROJECTS_DISABLED_RESOLVER_KEY = 'manageProjectsDisabled';
export const MANAGE_PIECES_DISABLED_RESOLVER_KEY = 'managePiecesDisabled';
export const MANAGE_TEMPLATES_DISABLED_RESOLVER_KEY = 'manageTemplatesDisabled';
export const AUDIT_LOG_DISABLED_RESOLVER_KEY = 'auditLogDisabled';
export const CUSTOM_DOMAINS_DISABLED_RESOLVER_KEY = 'customDomainsDisabled';
export const PROJECT_ROLE_DISABLED_RESOLVER_KEY = 'projectRoleDisabled';

export const SigningKeyDisabledResolver: ResolveFn<
  Observable<boolean>
> = () => {
  const platformService: PlatformService = inject(PlatformService);
  return platformService.embeddingDisabled();
};

export const projectRoleDisabledResolver: ResolveFn<
  Observable<boolean>
> = () => {
  const platformService: PlatformService = inject(PlatformService);
  return platformService.projectRolesDisabled();
};

export const appearanceDisabledResolver: ResolveFn<
  Observable<boolean>
> = () => {
  const platformService: PlatformService = inject(PlatformService);
  return platformService.customAppearanceDisabled();
};

export const manageProjectsResolver: ResolveFn<Observable<boolean>> = () => {
  const platformService: PlatformService = inject(PlatformService);
  return platformService.manageProjectsDisabled();
};

export const managePiecesResolver: ResolveFn<Observable<boolean>> = () => {
  const platformService: PlatformService = inject(PlatformService);
  return platformService.managePiecesDisabled();
};

export const manageTemplatesResolver: ResolveFn<Observable<boolean>> = () => {
  const platformService: PlatformService = inject(PlatformService);
  return platformService.manageTemplatesDisabled();
};

export const auditLogDisabledResolver: ResolveFn<Observable<boolean>> = () => {
  const platformService: PlatformService = inject(PlatformService);
  return platformService.auditLogDisabled();
};

export const customDomainsDisabledResolver: ResolveFn<
  Observable<boolean>
> = () => {
  const platformService: PlatformService = inject(PlatformService);
  return platformService.customDomainDisabled();
};
