import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { Store } from '@ngrx/store';
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
  CommonActions,
  FlowService,
} from '@activepieces/ui/common';
import { compareVersions } from 'compare-versions';
import { ApFlagId, FlowOperationType } from '@activepieces/shared';
import { TelemetryService } from '@activepieces/ui/common';
import { AuthenticationService, fadeInUp400ms } from '@activepieces/ui/common';
import { MatDialog } from '@angular/material/dialog';
import {
  CollectionBuilderService,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';

interface UpgradeNotificationMetaDataInLocalStorage {
  latestVersion: string;
  ignoreNotification: boolean;
}
const upgradeNotificationMetadataKeyInLocalStorage =
  'upgardeNotificationMetadata';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInUp400ms],
})
export class AppComponent implements OnInit {
  routeLoader$: Observable<unknown>;
  loggedInUser$: Observable<void>;
  warningMessage$: Observable<{ title?: string; body?: string } | undefined>;
  showUpgradeNotification$: Observable<boolean>;
  hideUpgradeNotification = false;
  openCommandBar$: Observable<void>;
  loading$: Subject<boolean> = new Subject();
  importTemplate$: Observable<void>;
  constructor(
    public dialog: MatDialog,
    private store: Store,
    private authenticationService: AuthenticationService,
    private flagService: FlagService,
    private telemetryService: TelemetryService,
    private router: Router,
    private maticonRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private builderService: CollectionBuilderService,
    private flowService: FlowService
  ) {
    this.registerSearchIconIntoMaterialIconRegistery();
    this.listenToImportFlow();
    this.routeLoader$ = this.router.events.pipe(
      tap((event) => {
        if (
          event instanceof NavigationStart &&
          event.url.startsWith('/flows/')
        ) {
          this.loading$.next(true);
        }
        if (event instanceof NavigationEnd) {
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
    this.showUpgradeNotification$ = this.flagService.getAllFlags().pipe(
      map((res) => {
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

  private listenToImportFlow() {
    this.importTemplate$ = this.builderService.importTemplate$
      .asObservable()
      .pipe(
        tap(() => {
          this.loading$.next(true);
        }),
        switchMap((res) => {
          return this.flowService
            .update(res.flowId, {
              type: FlowOperationType.IMPORT_FLOW,
              request: {
                displayName: res.template.name,
                trigger: res.template.template.trigger,
              },
            })
            .pipe(
              tap((res) => {
                this.loading$.next(false);
                this.store.dispatch(FlowsActions.importFlow({ flow: res }));
              })
            );
        }),
        map(() => void 0)
      );
  }

  private registerSearchIconIntoMaterialIconRegistery() {
    this.maticonRegistry.addSvgIcon(
      'search',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        '../assets/img/custom/search.svg'
      )
    );
  }

  ngOnInit(): void {
    this.warningMessage$ = this.flagService.getWarningMessage();
    this.loggedInUser$ = this.authenticationService.currentUserSubject.pipe(
      tap((user) => {
        if (user == undefined || Object.keys(user).length == 0) {
          this.store.dispatch(CommonActions.clearState());
          return;
        }
        this.store.dispatch(CommonActions.loadInitial({ user: user }));
        this.telemetryService.init(user);
      }),
      map(() => void 0)
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
}
