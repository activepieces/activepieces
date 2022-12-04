import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EnvironmentService } from '../../../common-layout/service/environment.service';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { map, Observable, take } from 'rxjs';
import { EnvironmentSelectors } from '../../../common-layout/store/selector/environment.selector';
import { Store } from '@ngrx/store';

@Component({
	selector: 'app-environment-filter',
	templateUrl: './environment-filter.component.html',
	styleUrls: ['./environment-filter.component.css'],
})
export class EnvironmentFilterComponent implements OnInit {
	faChevronDown = faChevronDown;

	selectedValue: any;
	environments$: Observable<{
		items: { value: any; label: string }[];
	}>;
	wasInside = false;
	opened = false;

	constructor(
		private environmentService: EnvironmentService,
		private actRoute: ActivatedRoute,
		private router: Router,
		private store: Store
	) {}

	ngOnInit(): void {
		this.getEnvironments();
		this.setSelectedValue();
	}

	setSelectedValue() {
		this.environmentService
			.cachedSelectedEnvironment()
			.pipe(take(1))
			.subscribe(value => {
				if (value) {
					this.selectedValue = value.name;
				}
			});
		/*    this.actRoute.queryParams.subscribe(value => {
      this.selectedValue = value['environem'];
      if (this.selectedValue) {
        this.searchForm.controls['accountName'].setValue(this.selectedValue);
      }
    });*/
	}

	getEnvironments() {
		this.environments$ = this.store.select(EnvironmentSelectors.selectEnvironments).pipe(
			map(environments => {
				return {
					items: environments.map(env => {
						return { label: env.name, value: env.name };
					}),
				};
			})
		);
	}

	refreshQueryParams(environmentDropdownOption: { label: string; value: string }) {
		this.selectedValue = environmentDropdownOption.value;
		this.actRoute.queryParams.pipe(take(1)).subscribe(queryParams => {
			const newQ = JSON.parse(JSON.stringify(queryParams));
			newQ.environment = environmentDropdownOption.value;
			this.router.navigate([], { queryParams: newQ });
		});
	}

	@HostListener('click')
	clickInside() {
		this.wasInside = true;
	}

	@HostListener('document:click')
	clickOut() {
		if (!this.wasInside) {
			this.opened = false;
		}
		this.wasInside = false;
	}
}
