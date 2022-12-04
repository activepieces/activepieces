import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-instances-filter',
	templateUrl: './instances-filter.component.html',
	styleUrls: ['./instances-filter.component.css'],
})
export class InstancesFilterComponent implements OnInit {
	faChevronDown = faChevronDown;
	opened = false;
	wasInside = false;

	selectedValue: any;
	searchForm: FormGroup;

	constructor(private formBuilder: FormBuilder, private router: Router, private actRoute: ActivatedRoute) {
		this.searchForm = this.formBuilder.group({
			instanceId: [, []],
		});
	}

	ngOnInit(): void {
		this.selectedValue = undefined;
		this.actRoute.queryParams.subscribe(value => {
			this.selectedValue = value['instanceId'];
			if (this.selectedValue) {
				this.searchForm.controls['instanceId'].setValue(this.selectedValue);
			}
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

	applyFilter() {
		if (this.searchForm.invalid) return;
		this.opened = false;
		const value = this.searchForm.value.instanceId;
		this.changeInstanceId(value && value.length > 0 ? value : undefined);
	}

	changeInstanceId(newValue: string | undefined) {
		this.opened = false;
		this.actRoute.queryParams.subscribe(queryParams => {
			const newQ = JSON.parse(JSON.stringify(queryParams));
			newQ.instanceId = newValue;
			this.router.navigate([], { queryParams: newQ });
		});
	}
}
