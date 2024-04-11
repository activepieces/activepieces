import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

import {
  FlagService,
  AppearanceService,
  environment,
  PlatformService,
  FlowBuilderService,
  TelemetryService,
} from '@activepieces/ui/common';
import { compareVersions } from 'compare-versions';
import { ApEdition, ApFlagId, LocalesEnum } from '@activepieces/shared';
import {
  EmbeddingService,
  AuthenticationService,
  fadeInUp400ms,
  LocalesService,
} from '@activepieces/ui/common';
import { MatDialog } from '@angular/material/dialog';
import { Platform } from '@activepieces/shared';
import { UserWithoutPassword } from '@activepieces/shared';

interface UpgradeNotificationMetaDataInLocalStorage {
  latestVersion: string;
  ignoreNotification: boolean;
}
const upgradeNotificationMetadataKeyInLocalStorage =
  'upgradeNotificationMetadata';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInUp400ms],
})
export class AppComponent implements OnInit {
  routeLoader$: Observable<unknown>;
  loggedInUser$: Observable<UserWithoutPassword | undefined>;
  showUpgradeNotification$: Observable<boolean>;
  hideUpgradeNotification = false;
  logoutOldTokens$: Observable<void>;
  loading$: Subject<boolean> = new Subject();
  importTemplate$: Observable<void>;
  loadingTheme$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  theme$: Observable<void>;
  setTitle$: Observable<void>;
  isCommunityEdition$: Observable<boolean>;
  embeddedRouteListener$: Observable<boolean>;
  redirect$?: Observable<Platform | undefined>;
  toggleLoading$: Observable<boolean>;
  constructor(
    public dialog: MatDialog,
    private appearanceService: AppearanceService,
    private authenticationService: AuthenticationService,
    private flagService: FlagService,
    private router: Router,
    private maticonRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private embeddedService: EmbeddingService,
    private localesService: LocalesService,
    private platformService: PlatformService,
    private builderService: FlowBuilderService,
    private telemetryService: TelemetryService
  ) {
    this.toggleLoading$ = this.builderService.loading$.pipe(
      tap((res) => {
        console.log('loading triggered');
        this.loading$.next(res);
      })
    );
    this.registerMaterialIcons();
    this.theme$ = this.appearanceService.setTheme().pipe(
      tap(() => this.loadingTheme$.next(false)),
      map(() => void 0)
    );
    this.embeddedRouteListener$ = this.createEmbeddingRoutesListener();
    this.routeLoader$ = this.createRouteListenerToToggleLoadingAndSetTitle();
    this.showUpgradeNotification$ =
      this.createListenerToToggleUpgradeNotification();
    this.redirectToCorrectLocale();
  }

  private registerMaterialIcons() {
    this.maticonRegistry.addSvgIcon(
      'search',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        '../assets/img/custom/search.svg'
      )
    );
    this.maticonRegistry.addSvgIcon(
      'custom_expand_less',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        '../assets/img/custom/expand_less.svg'
      )
    );
    this.maticonRegistry.addSvgIcon(
      'custom_expand_more',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        '../assets/img/custom/expand_more.svg'
      )
    );
  }

  ngOnInit(): void {
    this.loggedInUser$ = this.authenticationService.currentUserSubject.pipe(
      tap((user) => {
        const decodedToken = this.authenticationService.getDecodedToken();
        if (
          user == undefined ||
          Object.keys(user).length == 0 ||
          !decodedToken
        ) {
          return;
        }
        this.telemetryService.init(user);
      })
    );
  }

  getUpgradeNotificationMetadataInLocalStorage() {
    try {
      const localStorageValue = localStorage.getItem(
        upgradeNotificationMetadataKeyInLocalStorage
      );
      if (localStorageValue) {
        return JSON.parse(
          localStorageValue
        ) as UpgradeNotificationMetaDataInLocalStorage;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  ignoreUpgradeNotification() {
    const metadataInLocatStorage =
      this.getUpgradeNotificationMetadataInLocalStorage()!;
    metadataInLocatStorage.ignoreNotification = true;
    localStorage.setItem(
      upgradeNotificationMetadataKeyInLocalStorage,
      JSON.stringify(metadataInLocatStorage)
    );
    this.showUpgradeNotification$ = of(false);
  }
  openUpgradeDocs() {
    window.open(
      'https://www.activepieces.com/docs/install/docker#upgrading',
      '_blank',
      'noopener noreferrer'
    );
  }

  private createRouteListenerToToggleLoadingAndSetTitle() {
    return this.router.events.pipe(
      tap((event) => {
        if (
          event instanceof NavigationStart &&
          event.url.startsWith('/flows/')
        ) {
          this.loading$.next(true);
        }
        if (event instanceof NavigationEnd) {
          let route = this.router.routerState.root;

          while (route.firstChild) {
            route = route.firstChild;
          }
          const { title } = route.snapshot.data;
          if (title) {
            this.setTitle$ = this.appearanceService.setTitle(title);
          }
          this.loading$.next(false);
        }

        if (event instanceof NavigationCancel) {
          this.loading$.next(false);
        }
        if (event instanceof NavigationError) {
          this.loading$.next(false);
        }
      })
    );
  }

  private createListenerToToggleUpgradeNotification() {
    return this.flagService.getAllFlags().pipe(
      map((res) => {
        if (res[ApFlagId.EDITION] !== ApEdition.COMMUNITY) {
          return false;
        }
        const currentVersion =
          (res[ApFlagId.CURRENT_VERSION] as string) || '0.0.0';
        const latestVersion =
          (res[ApFlagId.LATEST_VERSION] as string) || '0.0.0';
        const upgradeNotificationMetadataInLocalStorage =
          this.getUpgradeNotificationMetadataInLocalStorage();
        if (!upgradeNotificationMetadataInLocalStorage) {
          localStorage.setItem(
            upgradeNotificationMetadataKeyInLocalStorage,
            JSON.stringify({
              latestVersion: latestVersion,
              ignoreNotification: false,
            })
          );
          return compareVersions(latestVersion, currentVersion) === 1;
        } else {
          localStorage.setItem(
            upgradeNotificationMetadataKeyInLocalStorage,
            JSON.stringify({
              latestVersion: latestVersion,
              ignoreNotification:
                upgradeNotificationMetadataInLocalStorage.ignoreNotification,
            })
          );
          return (
            (!upgradeNotificationMetadataInLocalStorage.ignoreNotification &&
              compareVersions(latestVersion, currentVersion) === 1) ||
            (compareVersions(
              latestVersion,
              upgradeNotificationMetadataInLocalStorage.latestVersion
            ) === 1 &&
              compareVersions(latestVersion, currentVersion) === 1)
          );
        }
      })
    );
  }

  private createEmbeddingRoutesListener() {
    return this.router.events.pipe(
      switchMap((routingEvent) => {
        return this.embeddedService.getIsInEmbedding$().pipe(
          tap((embedded) => {
            if (
              routingEvent instanceof NavigationStart &&
              routingEvent.url === '/embed' &&
              embedded
            ) {
              console.error('visiting /embed after init');
              this.router.navigate(['/'], { skipLocationChange: true });
            }
            if (embedded && routingEvent instanceof NavigationEnd) {
              this.embeddedService.activepiecesRouteChanged(this.router.url);
            }
          })
        );
      })
    );
  }
  private redirectToCorrectLocale() {
    if (environment.production) {
      //TODO: once we start having /en routes this logic should be altered to checking (if the localeFromBrowserUrl is undefined, switch to what is in localstorage)
      this.redirect$ = this.authenticationService.currentUserSubject.pipe(
        switchMap((usr) => {
          const platformId = this.authenticationService.getPlatformId();
          if (usr && platformId && Object.keys(usr).length > 0) {
            return this.platformService.getPlatform(platformId).pipe(
              tap((platform) => {
                this.redirectToUserLocale(platform.defaultLocale);
              })
            );
          }
          return of(undefined).pipe(
            tap(() => {
              return this.redirectToUserLocale();
            })
          );
        })
      );
    }
  }

  /**Redirects to user locale if there's a mismatch between locale stored in localStorage and locale specified in url */
  private redirectToUserLocale(platformDefaultLocale?: LocalesEnum) {
    const currentLocaleFromUrl =
      this.localesService.getCurrentLocaleFromBrowserUrlOrDefault();
    const currentLocaleFormLocalstorageOrDefault =
      this.localesService.getCurrentLocaleFromLocalStorage() ||
      platformDefaultLocale ||
      this.localesService.defaultLocale;
    if (currentLocaleFormLocalstorageOrDefault !== currentLocaleFromUrl) {
      this.localesService.setCurrentLocale(
        currentLocaleFormLocalstorageOrDefault
      );
      this.localesService.redirectToLocale(
        currentLocaleFormLocalstorageOrDefault
      );
    }
  }
}
