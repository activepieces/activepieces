import { Component, OnInit } from '@angular/core';
import { NavigationService } from '../dashboard-layout/service/navigation.service';

@Component({
	selector: 'app-not-found',
	templateUrl: './not-found.component.html',
})
export class NotFoundComponent implements OnInit {
	constructor(private navigationService: NavigationService) {}

	ngOnInit() {
		this.navigationService.setTitle('Not Found');
	}
}
