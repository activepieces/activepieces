import { Component, OnInit } from '@angular/core';
import { NavigationService } from '../../dashboard-layout/service/navigation.service';

@Component({
	selector: 'app-change-log',
	templateUrl: './change-log.component.html',
	styleUrls: ['./change-log.component.css'],
})
export class ChangeLogComponent implements OnInit {
	constructor(private navigationService: NavigationService) {
		this.navigationService.setTitle('Change log');
	}

	ngOnInit(): void {}
}
