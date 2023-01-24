import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { AuthenticationService } from './modules/common/service/authentication.service';
import { Store } from '@ngrx/store';
import { NavigationStart, Router } from '@angular/router';
import { TelemetryService } from './modules/common/service/telemetry.service';
import { fadeInUp400ms } from './modules/common/animation/fade-in-up.animation';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonActions } from './modules/common/store/common.action';
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
	constructor(
		private store: Store,
		private authenticationService: AuthenticationService,
		private router: Router,
		private posthogService: TelemetryService,
		private maticonRegistry: MatIconRegistry,
		private domSanitizer: DomSanitizer
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
				if (user.trackEvents) {
					this.posthogService.init();
				}
			}),
			map(() => void 0)
		);
	}
}
