import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import {
  ApFlagId,
  Platform,
  SeekPage,
  UpdatePlatformRequestBody,
  UserResponse,
} from '@activepieces/shared';
import { AuthenticationService } from './authentication.service';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { FlagService } from './flag.service';

type PlatformFeature = keyof Platform;

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private refresh$: BehaviorSubject<void> = new BehaviorSubject<void>(
    undefined
  );
  constructor(
    private http: HttpClient,
    private flagsService: FlagService,
    private authenticationService: AuthenticationService
  ) {}

  updatePlatform(req: UpdatePlatformRequestBody, platformId: string) {
    return this.http
      .post<void>(`${environment.apiUrl}/platforms/${platformId}`, req)
      .pipe(tap(() => this.refresh$.next()));
  }

  getPlatform(platformId: string) {
    return this.http.get<Platform>(
      `${environment.apiUrl}/platforms/${platformId}`
    );
  }
  listUsers() {
    return this.http.get<SeekPage<UserResponse>>(`${environment.apiUrl}/users`);
  }

  currentPlatform(): Observable<null | Platform> {
    return combineLatest([
      this.authenticationService.currentUserSubject.asObservable(),
      this.refresh$,
    ]).pipe(
      switchMap(([auth]) => {
        if (!auth?.platformId) {
          return of(null);
        }
        return this.getPlatform(auth.platformId!);
      }),
      shareReplay(1)
    );
  }

  ssoSettingsDisabled() {
    return this.isFeatureDisabled('ssoEnabled');
  }

  currentPlatformNotNull(): Observable<Platform> {
    return this.currentPlatform().pipe(
      map((platform) => {
        if (!platform) {
          throw new Error('Platform not found');
        }
        return platform;
      })
    );
  }

  showPoweredByAp() {
    return this.currentPlatform().pipe(
      map((platform) => {
        return platform?.showPoweredBy ?? false;
      })
    );
  }

  private isFeatureDisabled(feature: PlatformFeature): Observable<boolean> {
    return combineLatest([
      this.flagsService.isFlagEnabled(ApFlagId.SHOW_PLATFORM_DEMO),
      this.currentPlatform(),
    ]).pipe(
      map(([isFlagEnabled, platform]) => {
        if (!platform) return true;
        return !(platform[feature] ?? true) || isFlagEnabled;
      })
    );
  }

  managePiecesDisabled() {
    return this.isFeatureDisabled('managePiecesEnabled');
  }

  customDomainDisabled() {
    return this.isFeatureDisabled('customDomainsEnabled');
  }

  issuesDisabled() {
    return this.currentPlatform().pipe(
      map((platform) => {
        if (!platform) {
          return true;
        }
        return !platform.flowIssuesEnabled;
      })
    );
  }

  manageProjectsDisabled() {
    return this.isFeatureDisabled('manageProjectsEnabled');
  }

  embeddingDisabled() {
    return this.isFeatureDisabled('embeddingEnabled');
  }

  apiKeysDisabled() {
    return this.isFeatureDisabled('apiKeysEnabled');
  }

  manageTemplatesDisabled() {
    return this.isFeatureDisabled('manageTemplatesEnabled');
  }

  customAppearanceDisabled() {
    return this.isFeatureDisabled('customAppearanceEnabled');
  }

  auditLogDisabled() {
    return this.isFeatureDisabled('auditLogEnabled');
  }

  projectRolesDisabled() {
    return this.currentPlatform().pipe(
      map((platform) => {
        if (!platform) {
          return true;
        }
        return !platform.projectRolesEnabled;
      })
    );
  }
}
