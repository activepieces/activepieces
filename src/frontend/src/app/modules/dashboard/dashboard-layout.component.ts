import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { NavigationService } from './service/navigation.service';
import { map, Observable, of, tap } from 'rxjs';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard-layout.component.html',
	styleUrls: ['./dashboard-layout.component.scss'],
})
export class DashboardLayoutComponent implements OnInit {
	route: any;
	loading$: Observable<boolean> = of(false);
	updateSelectedRoute$: Observable<void> = new Observable<void>();
	hasSubmenu = false;
	constructor(private navigationService: NavigationService, private cd: ChangeDetectorRef) {}

	ngOnInit(): void {
		this.updateSelectedRoute$ = this.navigationService.getSelectedRoute().pipe(
			tap(value => {
				this.updateRoute(value);
			}),
			map(value => void 0)
		);
		this.loading$ = this.navigationService.loading;
	}

	updateRoute(route: { menu }): void {
		this.route = this.navigationService.sidebarRoutes[route.menu];
		this.cd.detectChanges();
	}
}
