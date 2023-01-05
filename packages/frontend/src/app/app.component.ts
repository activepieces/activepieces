import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { AuthenticationService } from './modules/common/service/authentication.service';
import { Store } from '@ngrx/store';
import { NavigationStart, Router } from '@angular/router';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { CommonActions } from './modules/common/store/action/common.action';
import { PosthogService } from './modules/common/service/posthog.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
	routeLoader$: Observable<any>;
	unsavedIconLoader$: Observable<void> | undefined;
	loggedInUser$: Observable<any>;
	constructor(
		private store: Store,
		private authenticationService: AuthenticationService,
		private router: Router,
		private iconReg: SvgIconRegistryService,
		private posthogService: PosthogService
	) {
		this.unsavedIconLoader$ = this.iconReg.loadSvg('assets/img/custom/unsaved.svg')?.pipe(map(value => void 0));
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
		this.loggedInUser$ = this.authenticationService.currentUserSubject.pipe(
			tap(user => {
				if (user == undefined || Object.keys(user).length == 0) {
					this.store.dispatch(CommonActions.clearState());
					return;
				}
				debugger;
				this.store.dispatch(CommonActions.loadInitial({ user: user }));
				if (user.trackEvents) {
					this.posthogService.init();
				}
			}),
			map(() => void 0)
		);
	}
}
