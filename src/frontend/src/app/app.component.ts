import { Component, OnInit } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { AuthenticationService } from './modules/common/service/authentication.service';
import { Store } from '@ngrx/store';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { NavigationService } from './modules/dashboard/service/navigation.service';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { CommonActions } from './modules/common/store/action/common.action';
import { PosthogService } from './modules/common/service/posthog.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
	title = 'activepieces';
	routeLoader = true;

	routeLoader$: Observable<any>;
	unsavedIconLoader$: Observable<void> | undefined;
	loggedInUser$: Observable<any>;

	constructor(
		private store: Store,
		private authenticationService: AuthenticationService,
		private router: Router,
		private navigationService: NavigationService,
		private iconReg: SvgIconRegistryService,
		private posthogService: PosthogService
	) {
		this.unsavedIconLoader$ = this.iconReg.loadSvg('assets/img/custom/unsaved.svg')?.pipe(map(value => void 0));

		this.routeLoader$ = this.router.events.pipe(
			tap(event => {
				if (event instanceof NavigationStart) {
					const isNavigatingFromOrToBuilder =
						this.navigationService.isInBuilder || this.navigationService.navigatingToBuilder(event.url);
					if (!this.routeLoader) this.routeLoader = isNavigatingFromOrToBuilder;
				}

				if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
					this.routeLoader = false;
				}
			})
		);
	}

	ngOnInit(): void {
		this.loggedInUser$ = this.authenticationService.currentUserSubject.pipe(
			tap(user => {
				if (user == undefined || Object.keys(user).length == 0) {
					this.store.dispatch(CommonActions.clearState());
					return;
				}
				this.store.dispatch(CommonActions.loadInitial({ user: user }));
				if (user.track_events) {
					this.posthogService.init();
				}
			}),
			map(() => void 0)
		);
	}
}
