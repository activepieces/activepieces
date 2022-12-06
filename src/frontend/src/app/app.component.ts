import { Component, OnInit } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { AuthenticationService } from './layout/common-layout/service/authentication.service';
import { Store } from '@ngrx/store';
import LogRocket from 'logrocket';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { NavigationService } from './layout/dashboard-layout/service/navigation.service';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { CommonActions } from './layout/common-layout/store/action/common.action';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
	title = 'piece-builder';
	routeLoader = true;

	routeLoader$: Observable<any>;
	unsavedIconLoader$: Observable<void> | undefined;
	loggedInUser$: Observable<any>;

	constructor(
		private store: Store,
		private authenticationService: AuthenticationService,
		private router: Router,
		private navigationService: NavigationService,
		private iconReg: SvgIconRegistryService
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
		LogRocket.init('sz7toh/activepieces');

		this.loggedInUser$ = this.authenticationService.currentUserSubject.pipe(
			tap(user => {
				if (user == undefined || Object.keys(user).length == 0) {
					this.store.dispatch(CommonActions.clearState());
					return;
				}
				LogRocket.identify(user.id.toString(), {
					name: user.first_name + ' ' + user.last_name,
					email: user.email,
				});
				this.store.dispatch(CommonActions.loadInitial({ user: user }));
			}),
			map(() => void 0)
		);
	}
}
