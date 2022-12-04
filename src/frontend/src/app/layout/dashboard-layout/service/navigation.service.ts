import { Injectable } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import {
	NavigationCancel,
	NavigationEnd,
	NavigationError,
	NavigationStart,
	Router,
	RouterEvent,
} from '@angular/router';
import { Title } from '@angular/platform-browser';

@Injectable({
	providedIn: 'root',
})
export class NavigationService {
	isInBuilder = false;
	lastPageTitle = '';
	private selectedMenuIndex: BehaviorSubject<any> = new BehaviorSubject(0);
	private selectedRouteIndex: BehaviorSubject<any> = new BehaviorSubject(undefined);
	private submenuState: BehaviorSubject<any> = new BehaviorSubject(false);
	public loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	public sidebarRoutes = [
		{
			id: 'flows',
			icon: '/assets/img/custom/sidebar/pieces.svg',
			disabledIcon: '/assets/img/custom/sidebar/disabled/disabled-flows.svg',
			text: 'Flows',
			link: '/flows',
			submenu: false,
			color: '#af6cd9',
			submenuItems: [],
			hover: false,
		},
		{
			id: 'accounts',
			icon: '/assets/img/custom/sidebar/accounts.svg',
			disabledIcon: '/assets/img/custom/sidebar/disabled/disabled-accounts.svg',
			text: 'Accounts',
			submenu: true,
			color: '#6385dc',
			submenuItems: [
				{ id: 'accounts', text: 'All Accounts', link: '/accounts' },
				{ id: 'accounts', text: 'Instances', link: '/instances' },
				{ id: 'accounts', text: 'Runs', link: '/runs' },
			],
			hover: false,
		},
		{
			id: 'settings',
			icon: '/assets/img/custom/sidebar/settings.svg',
			disabledIcon: '/assets/img/custom/sidebar/disabled/disabled-settings.svg',
			text: 'Settings',
			submenu: true,
			color: '#5fd2b0',
			submenuItems: [
				{
					id: 'authentication',
					text: 'Authentication',
					link: '/authentication',
				},
				{ id: 'settings', text: 'Events', link: '/events' },
				{ id: 'settings', text: 'API Keys', link: '/api-keys' },
			],
			hover: false,
		},
	];

	constructor(private router: Router, private titleService: Title) {
		this.router.events.pipe(filter(event => event instanceof RouterEvent)).subscribe((event: any) => {
			this.navigationInterceptor(event);
		});
	}

	public navigatingToBuilder(url: string) {
		return url.indexOf('/flows/') != -1;
	}
	public setTitle(pageTitle: string) {
		if (pageTitle != 'Loading') {
			this.lastPageTitle = pageTitle;
		}
		this.titleService.setTitle('AP - ' + pageTitle);
	}
	private navigationInterceptor(event: RouterEvent): void {
		if (event instanceof NavigationStart) {
			this.setTitle('Loading');
			this.loading.next(true);
		}
		if (event instanceof NavigationEnd) {
			this.loading.next(false);
		}
		if (event instanceof NavigationCancel) {
			this.setTitle(this.lastPageTitle);
			this.loading.next(false);
		}
		if (event instanceof NavigationError) {
			this.setTitle(this.lastPageTitle);
			this.loading.next(false);
		}
	}

	public setSubmenuState(open: boolean) {
		this.submenuState.next(open);
	}

	public getSubmenuState() {
		return this.submenuState;
	}

	public setSelectedRoute(request: { menu: number; submenu: number | undefined } | undefined) {
		this.selectedRouteIndex.next(request);
	}

	public getSelectedRoute() {
		return this.selectedRouteIndex;
	}

	public setSelectedMenuIndex(index: number | undefined) {
		this.selectedMenuIndex.next(index);
	}

	public getSelectedMenuIndex() {
		return this.selectedMenuIndex;
	}
}
