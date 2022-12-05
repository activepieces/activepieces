import { Component, OnInit } from '@angular/core';
import { SeekPage } from '../../../common-layout/service/seek-page';
import { ActivatedRoute, Router } from '@angular/router';
import { TimeHelperService } from '../../../common-layout/service/time-helper.service';
import { InstanceRun } from '../../../common-layout/model/instance-run.interface';
import { ThemeService } from '../../../common-layout/service/theme.service';
import { InstanceRunStatus } from '../../../common-layout/model/enum/instance-run-status';
import { NavigationService } from '../../service/navigation.service';
import { map, Observable } from 'rxjs';

@Component({
	selector: 'app-runs',
	templateUrl: './runs.component.html',
	styleUrls: ['./runs.component.scss'],
})
export class RunsComponent implements OnInit {
	runsPage$: Observable<SeekPage<InstanceRun>>;

	constructor(
		private actRoute: ActivatedRoute,
		private router: Router,
		private navigationService: NavigationService,
		public themeService: ThemeService,
		public timeHelperService: TimeHelperService
	) {}

	ngOnInit(): void {
		this.navigationService.setTitle('Runs');
		this.runsPage$ = this.actRoute.data.pipe(
			map(data => {
				return data['runs'];
			})
		);
	}

	openInstanceRun(run: InstanceRun) {
		const url = this.router.serializeUrl(this.router.createUrlTree(['/runs'])) + '/' + run.id;
		window.open(url, '_blank');
	}

	instanceRunEnum() {
		return InstanceRunStatus;
	}
}
