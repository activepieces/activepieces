import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';
import { AuthenticationService } from './modules/common/service/authentication.service';
import { Store } from '@ngrx/store';
import { NavigationStart, Router } from '@angular/router';
import { TelemetryService } from './modules/common/service/telemetry.service';
import { fadeInUp400ms } from './modules/common/animation/fade-in-up.animation';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonActions } from './modules/common/store/common.action';
import { compareVersions } from 'compare-versions';
import { FlagIds } from '@activepieces/shared';
interface UpgradeNotificationMetaDataInLocalStorage {
	latestVersion: string,
	ignoreNotification: boolean
}
const upgradeNotificationMetadataKeyInLocalStorage = 'upgardeNotificationMetadata';
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [fadeInUp400ms],
})
export class AppComponent implements OnInit {
	routeLoader$: Observable<any>;
	loggedInUser$: Observable<any>;
	warningMessage$: Observable<{ title?: string; body?: string } | undefined>;
	showUpgradeNotification$: Observable<boolean>;
	hideUpgradeNotification = false;
	constructor(
		private store: Store,
		private authenticationService: AuthenticationService,
		private router: Router,
		private posthogService: TelemetryService,
		private maticonRegistry: MatIconRegistry,
		private domSanitizer: DomSanitizer,
	) {
		this.maticonRegistry.addSvgIcon(
			'search',
			this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/img/custom/search.svg')
		);
		this.routeLoader$ = this.router.events.pipe(
			map(event => {
				if (event instanceof NavigationStart) {
					return true;
				}
				return false;
			})
		);
		this.showUpgradeNotification$ = this.authenticationService.getAllFlags().pipe(map(res => {
			const currentVersion = res[FlagIds.CURRENT_VERSION] as string || '0.0.0';
			const latestVersion = res[FlagIds.LATEST_VERSION] as string || '0.0.0';
			const upgradeNotificationMetadataInLocalStorage = this.getUpgradeNotificationMetadataInLocalStorage();
			if (!upgradeNotificationMetadataInLocalStorage) {
				localStorage.setItem(upgradeNotificationMetadataKeyInLocalStorage, JSON.stringify({ latestVersion: latestVersion, ignoreNotification: false }));
				return compareVersions(latestVersion, currentVersion) === 1;
			}
			else {
				return (!upgradeNotificationMetadataInLocalStorage.ignoreNotification && compareVersions(latestVersion, currentVersion) === 1) ||
					(compareVersions(latestVersion, upgradeNotificationMetadataInLocalStorage.latestVersion) === 1 && compareVersions(latestVersion, currentVersion) === 1);
			}
		}));

	}

	ngOnInit(): void {
		this.warningMessage$ = this.authenticationService.getWarningMessage();
		this.loggedInUser$ = this.authenticationService.currentUserSubject.pipe(
			tap(user => {
				if (user == undefined || Object.keys(user).length == 0) {
					this.store.dispatch(CommonActions.clearState());
					return;
				}
				this.store.dispatch(CommonActions.loadInitial({ user: user }));
				this.posthogService.init(user);
			}),
			map(() => void 0)
		);
	}

	getUpgradeNotificationMetadataInLocalStorage() {
		try {
			const localStorageValue = localStorage.getItem(upgradeNotificationMetadataKeyInLocalStorage);
			if (localStorageValue) {
				return JSON.parse(localStorageValue) as UpgradeNotificationMetaDataInLocalStorage
			}
			return null;
		}
		catch (e) {
			return null;

		}

	}
	ignoreUpgradeNotification() {
		const metadataInLocatStorage = this.getUpgradeNotificationMetadataInLocalStorage()!;
		metadataInLocatStorage.ignoreNotification = true;
		localStorage.setItem(upgradeNotificationMetadataKeyInLocalStorage, JSON.stringify(metadataInLocatStorage));
		this.showUpgradeNotification$ = of(false);

	}
	openUpgradeDocs() {
		window.open('https://www.activepieces.com/docs/install/docker#upgrading', '_blank');
	}
}
