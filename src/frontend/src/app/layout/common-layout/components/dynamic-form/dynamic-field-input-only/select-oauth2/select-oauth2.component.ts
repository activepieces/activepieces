import { Component, Input } from '@angular/core';
import { Oauth2SelectFormControl } from '../../../../model/dynamic-controls/oauth2-select-form-control';
import { distinctUntilChanged, map, Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../../../flow-builder/store/selector/flow-builder.selector';
import { UUID } from 'angular2-uuid';
import { DropdownFormControl } from '../../../../model/dynamic-controls/dropdown-form-control';
import { DropdownItemOption } from '../../../../model/fields/variable/subfields/dropdown-item-option';

import { BsModalService } from 'ngx-bootstrap/modal';
import { Validators } from '@angular/forms';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';

@Component({
	selector: 'app-select-oauth2',
	templateUrl: './select-oauth2.component.html',
	styleUrls: ['./select-oauth2.component.scss'],
})
export class SelectOauth2Component {
	dropdownFormControl: DropdownFormControl;
	_dynamicControl: Oauth2SelectFormControl;
	optionsSubscription: Subscription;
	valueSyncSubscription: Subscription;

	@Input() set dynamicControl(_dynamicControl: Oauth2SelectFormControl) {
		this._dynamicControl = _dynamicControl;
		if (this.optionsSubscription != undefined && !this.optionsSubscription.closed) {
			this.optionsSubscription.unsubscribe();
		}
		if (this.valueSyncSubscription != undefined && !this.valueSyncSubscription.closed) {
			this.valueSyncSubscription.unsubscribe();
		}

		this.optionsSubscription = this.findSuitableAuth(null, this.dynamicControl.getFlowId())
			.pipe(
				map(configs => {
					const dropdownOptions: DropdownItemOption[] = [];
					for (let i = 0; i < configs.length; ++i) {
						dropdownOptions.push({
							value: '${configs.' + configs[i].key + '}',
							label: configs[i].label,
						});
					}
					``;
					return dropdownOptions;
				})
			)
			.subscribe(configs => {
				this.dropdownFormControl = new DropdownFormControl({
					name: this._dynamicControl.getName(),
					label: this._dynamicControl.getLabel(),
					value: this._dynamicControl.formControl().value,
					dropdownOptions: configs,
					disabled: this._dynamicControl.isDisabled(),
					validatorFns: [Validators.required],
				});

				this.valueSyncSubscription = this.dropdownFormControl.formControl().valueChanges.subscribe(value => {
					_dynamicControl.formControl().setValue(value);
				});
			});
	}

	get dynamicControl() {
		return this._dynamicControl;
	}

	constructor(private store: Store, private modalService: BsModalService) {}

	findSuitableAuth(oauth2Variable: any, flowId: UUID): Observable<Config[]> {
		return this.store
			.select(BuilderSelectors.selectAuth2Configs(oauth2Variable, flowId))
			.pipe(distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)));
	}

	updateValue($event: string) {
		this._dynamicControl.formControl().setValue($event);
	}

	openConfigVariable() {
		this, this.modalService;
		// let bsModalRef = this.modalService.show(CreateEditVariableModalComponent, {
		// 	ignoreBackdropClick: true,
		// });
		// (bsModalRef.content as CreateEditVariableModalComponent).information = {
		// 	parentType: ConfigScope.COLLECTION,
		// 	selectedIndex: undefined,
		// 	selectedVariable: undefined,
		// 	configFlowId: this._dynamicControl.getFlowId(),
		// 	configParent: this._dynamicControl.getVariable(),
		// };
	}
}
