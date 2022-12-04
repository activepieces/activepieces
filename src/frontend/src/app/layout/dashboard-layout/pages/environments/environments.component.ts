import { Component, OnInit } from '@angular/core';
import { TimeHelperService } from '../../../common-layout/service/time-helper.service';
import { ProjectEnvironment } from '../../../common-layout/model/project-environment.interface';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { ThemeService } from '../../../common-layout/service/theme.service';
import { Title } from '@angular/platform-browser';
import { NavigationService } from '../../service/navigation.service';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { EnvironmentSelectors } from '../../../common-layout/store/selector/environment.selector';

@Component({
	selector: 'app-environments',
	templateUrl: './environments.component.html',
	styleUrls: ['./environments.component.css'],
})
export class EnvironmentsComponent implements OnInit {
	faUsers = faUsers;
	environments$: Observable<ProjectEnvironment[]>;
	loadState$: Observable<boolean>;

	constructor(
		public themeService: ThemeService,
		public titleService: Title,
		private store: Store,
		private navigationService: NavigationService,
		public timeHelperService: TimeHelperService
	) {}

	ngOnInit(): void {
		this.navigationService.setTitle('Environments');
		this.environments$ = this.store.select(EnvironmentSelectors.selectEnvironments);
		this.loadState$ = this.store.select(EnvironmentSelectors.selectEnvironmentsLoadState);
	}
}
