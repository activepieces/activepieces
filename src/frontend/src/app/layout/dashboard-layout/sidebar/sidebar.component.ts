import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../common-layout/service/theme.service';
import { NavigationEnd, Router } from '@angular/router';
import { NavigationService } from '../service/navigation.service';
import { AuthenticationService } from '../../common-layout/service/authentication.service';
import { BsDropdownConfig } from 'ngx-bootstrap/dropdown';
import { UserbackService } from '../../common-layout/service/userback.service';
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
	updateSubmenuOpen$: Observable<boolean> = of(false);
	updateSelectedIndex$: Observable<void>;
	updateSelectedSubmenuIndex$: Observable<{ menu: number; submenu: number } | undefined> = of(undefined);

	submenuOpen: boolean = false;
	selectedIndex: number = 0;
	selectedSubmenuIndex: { menu: number; submenu: number } | undefined = undefined;

	supportButtonHovered = false;
	DEFAULT_WIDTH = 250;
	ICON_BAR_WIDTH = 80;

	constructor(
		private themeService: ThemeService,
		private router: Router,
		private authenticationService: AuthenticationService,
		public navigationService: NavigationService,
		private userbackService: UserbackService
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
		this.updateSubmenuOpen$ = this.navigationService.getSubmenuState().pipe(
			tap(value => {
				this.submenuOpen = value;
			})
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
		let sub: any = undefined;
		let main: any = undefined;
		for (let i = 0; i < this.navigationService.sidebarRoutes.length; ++i) {
			for (let j = 0; j < this.navigationService.sidebarRoutes[i].submenuItems.length; ++j) {
				const linkPrefix = this.navigationService.sidebarRoutes[i].submenuItems[j].link;
				if (linkPrefix && currentRoute.startsWith(linkPrefix)) {
					main = i;
					sub = j;
				}
			}
		}
		if (main === undefined) {
			main = 0;
			sub = 0;
		}
		this.navigationService.setSubmenuState(sub !== undefined);
		this.navigationService.setSelectedMenuIndex(main);
		this.navigationService.setSelectedRoute({ menu: main, submenu: sub });
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

	clickSubmenu(index: number, route: any) {
		if (!this.isTrialExpired) {
			this.navigationService.setSubmenuState(route.submenu);
			this.navigationService.setSelectedMenuIndex(index);
			if (!route.submenu) {
				this.navigationService.setSelectedRoute({
					menu: index,
					submenu: undefined,
				});
				this.router.navigate([route.link]).then(r => {});
			} else {
				this.navigationService.setSelectedRoute({ menu: index, submenu: 0 });
				this.router.navigate([this.navigationService.sidebarRoutes[index].submenuItems[0].link]);
			}
		}
	}

	borderColor(index: any) {
		if (this.isTrialExpired || index !== this.selectedIndex) return {};

		return {
			border: '1px solid ' + this.navigationService.sidebarRoutes[index].color,
		};
	}

	selectSubMenu(index: number, item: any) {
		this.navigationService.setSelectedRoute({
			menu: this.selectedIndex,
			submenu: index,
		});
		this.router.navigate([item.link]).then(r => {});
	}

	openUserback() {
		this.userbackService.openUserbackSubject.next(true);
	}

	get isTrialExpired() {
		const now = new Date().getTime() / 1000;

		return (
			this.authenticationService.currentUser.epochExpirationTime &&
			this.authenticationService.currentUser.epochExpirationTime < now
		);
	}

	navigateHome() {
		const route = this.navigationService.sidebarRoutes.find(r => r.link === '/flows')!;
		const index = this.navigationService.sidebarRoutes.findIndex(r => r.link === '/flows');
		this.navigationService.setSubmenuState(route.submenu);
		this.navigationService.setSelectedMenuIndex(index);
		this.navigationService.setSelectedRoute({
			menu: index,
			submenu: undefined,
		});
		this.router.navigate([route.link]).then(r => {});
	}
}
