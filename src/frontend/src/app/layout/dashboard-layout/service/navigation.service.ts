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
	private selectedRouteIndex$: BehaviorSubject<any> = new BehaviorSubject(undefined);
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
			hover: false,
		},

		{
			id: 'instances',
			icon: '/assets/img/custom/sidebar/instances.svg',
			disabledIcon: '/assets/img/custom/sidebar/disabled/disabled-settings.svg',
			text: 'Instances',
			submenu: false,
			color: '#5fd2b0',
			hover: false,
			link: '/instances',
		},
		{
			id: 'runs',
			icon: '/assets/img/custom/sidebar/runs.svg',
			disabledIcon: '/assets/img/custom/sidebar/disabled/disabled-settings.svg',
			text: 'Runs',
			submenu: false,
			color: '#6385dc',
			hover: false,
			link: '/runs',
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

	public setSelectedRoute(request: { menu: number } | undefined) {
		this.selectedRouteIndex$.next(request);
	}

	public getSelectedRoute() {
		return this.selectedRouteIndex$;
	}

	public setSelectedMenuIndex(index: number | undefined) {
		this.selectedMenuIndex.next(index);
	}

	public getSelectedMenuIndex() {
		return this.selectedMenuIndex;
	}
}
