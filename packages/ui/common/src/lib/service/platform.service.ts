import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import {
  ActionType,
  ApFlagId,
  PieceCategory,
  Platform,
  SeekPage,
  TriggerType,
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
  switchMap,
  tap,
  take,
} from 'rxjs';
import { FlagService } from './flag.service';
import { FlowItemDetails } from '../models/flow-item-details';

type PlatformFeature = keyof Platform;

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private refresh$: BehaviorSubject<void> = new BehaviorSubject<void>(
    undefined
  );
  private platform$: BehaviorSubject<Platform | null> =
    new BehaviorSubject<Platform | null>(null);
  constructor(
    private http: HttpClient,
    private flagsService: FlagService,
    private authenticationService: AuthenticationService
  ) {
    this.authenticationService.currentUserSubject
      .pipe(
        tap((user) => {
          if (!user) {
            this.clearCachedPlatform();
          }
        })
      )
      .subscribe();
  }

  updatePlatform(req: UpdatePlatformRequestBody, platformId: string) {
    return this.http
      .post<void>(`${environment.apiUrl}/platforms/${platformId}`, req)
      .pipe(tap(() => this.refresh$.next()));
  }

  getCurrentUserPlatform() {
    const platformId = this.authenticationService.getPlatformId();
    if (!this.authenticationService.isLoggedIn() || !platformId) {
      throw new Error('No user is logged in');
    }
    return this.platform$.asObservable().pipe(
      switchMap((res) => {
        if (res) {
          return of(res);
        }
        return this.getPlatform(platformId).pipe(
          tap((res) => {
            console.log('cache set');
            this.platform$.next(res);
          })
        );
      }),
      take(1)
    );
  }
  private getPlatform(platformId: string) {
    return this.http.get<Platform>(
      `${environment.apiUrl}/platforms/${platformId}`
    );
  }
  listUsers() {
    return this.http.get<SeekPage<UserResponse>>(`${environment.apiUrl}/users`);
  }

  ssoSettingsDisabled() {
    return this.isFeatureDisabled('ssoEnabled');
  }

  showPoweredByAp() {
    return this.getCurrentUserPlatform().pipe(
      map((platform) => {
        return platform?.showPoweredBy ?? false;
      })
    );
  }

  private isFeatureDisabled(feature: PlatformFeature): Observable<boolean> {
    return combineLatest([
      this.flagsService.isFlagEnabled(ApFlagId.SHOW_PLATFORM_DEMO),
      this.getCurrentUserPlatform(),
    ]).pipe(
      map(([isDemo, platform]) => {
        if (!platform) return true;
        return !(platform[feature] ?? true) || isDemo;
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
    return this.getCurrentUserPlatform().pipe(
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
    return this.getCurrentUserPlatform().pipe(
      map((platform) => {
        if (!platform) {
          return true;
        }
        return !platform.projectRolesEnabled;
      })
    );
  }

  isPieceLocked(flowItemDetails: FlowItemDetails): Observable<boolean> {
    const categories = flowItemDetails.categories;
    if (
      flowItemDetails.type !== ActionType.PIECE &&
      flowItemDetails.type !== TriggerType.PIECE
    ) {
      return of(false);
    }
    if (!categories || !categories.includes(PieceCategory.PREMIUM)) {
      return of(false);
    }
    return this.getCurrentUserPlatform().pipe(
      map((platform) => {
        if (!platform) {
          return false;
        }
        return !platform.premiumPieces.includes(
          flowItemDetails.extra!.pieceName
        );
      })
    );
  }
  clearCachedPlatform() {
    console.log('cache cleared');
    this.platform$.next(null);
  }
}
