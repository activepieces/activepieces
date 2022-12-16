import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../common-layout/service/theme.service';
import { NavigationEnd, Router } from '@angular/router';
import { NavigationService } from '../service/navigation.service';
import { BsDropdownConfig } from 'ngx-bootstrap/dropdown';
import { map, Observable, of, tap } from 'rxjs';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss'],
	providers: [
		{
			provide: BsDropdownConfig,
			useValue: { isAnimated: false, autoClose: true },
		},
	],
})
export class SidebarComponent implements OnInit {
	selectedIndex$: Observable<number> = of(0);
	updateSelectedIndex$: Observable<void>;
	updateSelectedSubmenuIndex$: Observable<{ menu: number; submenu: number } | undefined> = of(undefined);
	selectedIndex: number = 0;
	selectedSubmenuIndex: { menu: number; submenu: number } | undefined = undefined;
	DEFAULT_WIDTH = 250;
	ICON_BAR_WIDTH = 80;

	constructor(
		private themeService: ThemeService,
		private router: Router,
		public navigationService: NavigationService
	) {}

	ngOnInit(): void {
		this.updateSelectedIndex(this.router.url);
		this.updateSelectedIndex$ = this.router.events.pipe(
			tap(val => {
				if (val instanceof NavigationEnd) {
					this.updateSelectedIndex(val.url);
				}
			}),
			map(() => void 0)
		);

		this.updateSelectedSubmenuIndex$ = this.navigationService.getSelectedRoute().pipe(
			tap(value => {
				this.selectedSubmenuIndex = value;
			})
		);
		this.selectedIndex$ = this.navigationService.getSelectedMenuIndex().pipe(
			tap(value => {
				this.selectedIndex = value;
			})
		);
	}

	updateSelectedIndex(currentRoute: string) {
		let routeIndex: number | undefined = undefined;
		routeIndex = this.navigationService.sidebarRoutes.findIndex(r => r.link === currentRoute);
		this.navigationService.setSelectedMenuIndex(routeIndex);
	}

	hoverContainer(submenuOpen) {
		return {
			boxShadow: 'inset -20px 0px 10px -20px rgba(0, 0, 0, 0.05), inset 1px 0px 0px rgba(224, 228, 232, 0.25)',
			transitionDuration: '0.5s',
			transitionProperty: 'left top',
			background: this.themeService.GRAYCARD_COLOR,
			width: submenuOpen ? this.DEFAULT_WIDTH - this.ICON_BAR_WIDTH + 'px' : '0px',
			overflow: 'hidden',
		};
	}

	sdContainer() {
		return {
			display: 'flex',
			zIndex: 1,
			flexDirection: 'column',
			width: this.ICON_BAR_WIDTH + 'px',
			height: '100%',
			background: this.themeService.SIDEBAR_COLOR,
			boxShadow: '1px 0px 0px #EBF0F5',
			overflow: 'hidden',
		};
	}

	borderColor(index: any) {
		if (index !== this.selectedIndex) return {};

		return {
			border: '1px solid ' + this.navigationService.sidebarRoutes[index].color,
		};
	}

	selectMenu(item: any) {
		this.navigationService.setSelectedRoute({
			menu: this.selectedIndex,
		});
		this.router.navigate([item.link]).then(r => {});
	}

	navigateHome() {
		const route = this.navigationService.sidebarRoutes.find(r => r.link === '/flows')!;
		const index = this.navigationService.sidebarRoutes.findIndex(r => r.link === '/flows');
		this.navigationService.setSelectedMenuIndex(index);
		this.navigationService.setSelectedRoute({
			menu: index,
		});
		this.router.navigate([route.link]).then(r => {});
	}
}
