import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-accounts-filter',
	templateUrl: './accounts-filter.component.html',
	styleUrls: ['./accounts-filter.component.css'],
})
export class AccountsFilterComponent implements OnInit {
	faChevronDown = faChevronDown;
	opened = false;
	wasInside = false;

	selectedValue: any;
	searchForm: FormGroup;

	constructor(private formBuilder: FormBuilder, private router: Router, private actRoute: ActivatedRoute) {
		this.searchForm = this.formBuilder.group({
			accountName: [, []],
		});
	}

	ngOnInit(): void {
		this.selectedValue = undefined;
		this.actRoute.queryParams.subscribe(value => {
			this.selectedValue = value['accountName'];
			if (this.selectedValue) {
				this.searchForm.controls['accountName'].setValue(this.selectedValue);
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
		const value = this.searchForm.value.accountName;
		this.changeAccount(value && value.length > 0 ? value : undefined);
	}

	changeAccount(newValue: string | undefined) {
		this.opened = false;
		this.actRoute.queryParams.subscribe(queryParams => {
			const newQ = JSON.parse(JSON.stringify(queryParams));
			newQ.accountName = newValue;
			this.router.navigate([], { queryParams: newQ });
		});
	}
}
