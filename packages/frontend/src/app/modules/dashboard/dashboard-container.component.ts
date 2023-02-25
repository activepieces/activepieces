import { Component, OnDestroy, OnInit } from '@angular/core';
import { RunsLeftSnackbarComponent } from '@ee/billing/frontend/runs-left-snackbar/runs-left-snackbar.component';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { FlagService } from '../common/service/flag.service';
import { map, Observable, tap } from 'rxjs';
import { ApEdition } from '@activepieces/shared';

@Component({
	templateUrl: './dashboard-container.component.html',
	styleUrls: ['./dashboard-container.component.scss'],
	selector: 'app-dashboard-container',
})
export class DashboardContainerComponent implements OnInit, OnDestroy {
	runsLeftSnackBarRef: MatSnackBarRef<RunsLeftSnackbarComponent>;

	showSnackbar$: Observable<void>;

	constructor(private snackBar: MatSnackBar, private flagService: FlagService) { }

	ngOnInit(): void {
		this.showSnackbar$ = this.flagService.getEdition().pipe(tap(edition => {
			if (edition === ApEdition.ENTERPRISE) {
				this.runsLeftSnackBarRef = this.snackBar.openFromComponent(RunsLeftSnackbarComponent, {
					duration: undefined
				});
			}
		}), map(() => void 0));

	}

	ngOnDestroy(): void {
		if (this.runsLeftSnackBarRef !== undefined) {
			this.runsLeftSnackBarRef.dismiss();
		}
	}
}
