import { Component, Input, OnInit } from '@angular/core';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { map, Observable, shareReplay, tap } from 'rxjs';
import { DynamicDropdownResult } from 'src/app/layout/common-layout/model/dynamic-controls/dynamic-dropdown-result';
import { DropdownItemOption } from 'src/app/layout/common-layout/model/fields/variable/subfields/dropdown-item-option';
import { DynamicDropdownService } from 'src/app/layout/common-layout/service/dynamic-dropdown.service';

import { DropdownFormControl } from '../../../../model/dynamic-controls/dropdown-form-control';

@Component({
	selector: 'app-basic-select',
	templateUrl: './basic-select.component.html',
	styleUrls: ['./basic-select.component.scss'],
})
export class BasicSelectComponent implements OnInit {
	opened = false;
	wasInside = false;

	faChevronDown = faChevronDown;
	@Input() searchable = false;
	@Input() clearable = false;
	@Input() dynamicControl: DropdownFormControl | null;
	@Input() defaultMessage: string = 'No options';
	dynamicDropdownObs$: Observable<DynamicDropdownResult>;
	constructor(private dynamicDropdownService: DynamicDropdownService) {}
	ngOnInit(): void {
		if (this.dynamicControl?.isDynamic) {
			console.log('refresh listener');
			this.dynamicControl.dynamicDropdownRefreshSubject.subscribe(refreshersValues => {
				console.log('refresh subscriber');
				this.refresh(refreshersValues);
			});
			this.dynamicDropdownService.refreshersListenerIsReadySubject.next(this.dynamicControl.getName());
		}
	}

	refresh(requestBody: { [key: string]: any }) {
		console.log('refresh');
		if (this.dynamicControl) {
			if (this.dynamicControl.collectionVersionId) {
				this.dynamicDropdownObs$ = this.dynamicDropdownService.refreshCollectionDynamicDropdownConfig(
					this.dynamicControl.collectionVersionId,
					this.dynamicControl.getName(),
					requestBody
				);
			} else {
				this.dynamicDropdownObs$ = this.dynamicDropdownService.refreshFlowDynamicDropdownConfig(
					this.dynamicControl.flowVersionId,
					this.dynamicControl.getName(),
					requestBody
				);
			}
			this.dynamicDropdownObs$ = this.dynamicDropdownObs$.pipe(
				map(res => {
					if (!res) {
						const emptyResult = new DynamicDropdownResult();
						emptyResult.placeholder = 'No options';
						emptyResult.loaded = true;
						emptyResult.options = [];
						console.warn('returned result of dynamic dropdown was null');
						return emptyResult;
					} else {
						res.loaded = true;
					}
					return res;
				}),
				tap(res => {
					// if (res.disabled) this.dynamicControl?.formControl().disable();
				}),
				shareReplay()
			);
			// this.dynamicControl?.formControl().disable();
		}
	}
	itemSelected(item: DropdownItemOption) {
		return this.dynamicControl?.formControl().value == item.value;
	}
	clicked(event: Event) {
		event.stopImmediatePropagation();
		console.log('clicked');
	}
}
