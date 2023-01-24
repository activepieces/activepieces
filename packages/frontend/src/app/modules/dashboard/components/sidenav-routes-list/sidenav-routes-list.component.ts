import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

type SideNavRoute = {
	icon: string;
	borderColorInTailwind: string;
	caption: string;
	route: string;
};

@Component({
	selector: 'app-sidenav-routes-list',
	templateUrl: './sidenav-routes-list.component.html',
	styleUrls: ['./sidenav-routes-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavRoutesListComponent implements OnInit {
	constructor(public router: Router) {}

	sideNavRoutes: SideNavRoute[] = [
		{
			icon: '/assets/img/custom/dashboard/collections.svg',
			borderColorInTailwind: '!ap-border-purpleBorder',
			caption: 'Flows',
			route: 'flows',
		},
		{
			icon: 'assets/img/custom/dashboard/runs.svg',
			borderColorInTailwind: '!ap-border-greenBorder',
			caption: 'Runs',
			route: 'runs',
		},
		{
			icon: 'assets/img/custom/connections.svg',
			borderColorInTailwind: '!ap-border-blueBorder',
			caption: 'Connections',
			route: 'connections',
		},
	];
	ngOnInit(): void {}
	openDocs() {
		window.open('https://activepieces.com/docs', '_blank');
	}
}
