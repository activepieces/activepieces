import { Component, OnInit } from '@angular/core';
import { DataHeader } from '../../../common-layout/components/responsive-table/data-header';
import { DataRow } from '../../../common-layout/components/responsive-table/data-row';
import { SeekPage } from '../../../common-layout/service/seek-page';
import { Account } from '../../../common-layout/model/account.interface';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { NavigationService } from '../../service/navigation.service';
import { AccountService } from '../../../common-layout/service/account.service';
import { InstanceService } from '../../../common-layout/service/instance.service';
import { ThemeService } from '../../../common-layout/service/theme.service';
import { TimeHelperService } from '../../../common-layout/service/time-helper.service';
import { ActivatedRoute } from '@angular/router';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { ConfirmDeleteModalComponent } from '../../../common-layout/components/confirm-delete-modal/confirm-delete-modal.component';
import { combineLatest, map, Observable, switchMap, take, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DataCell } from '../../../common-layout/components/responsive-table/data-cell';
import { CreateAccountModalComponent } from '../../../common-layout/components/create-account-modal/create-account-modal.component';

@Component({
	selector: 'app-accounts',
	templateUrl: './accounts.component.html',
	styleUrls: ['./accounts.component.css'],
})
export class AccountsComponent implements OnInit {
	tableHeaders: DataHeader[] = [
		{ content: 'Name' },
		{
			align: 'center',
			content: 'Instances',
			width: '20%',
		},
		{ content: 'Created At', width: '15%' },
		{
			content: 'Create Account',
			isButton: true,
			align: 'center',
			width: '15%',
			actionToReturn: 'create-account',
		},
	];
	tableData: DataRow[];
	accountPage: SeekPage<Account>;

	bsModalRef: BsModalRef;
	hoverIndex: number;
	loading: boolean = false;

	environment: string;
	initPage$: Observable<void>;

	constructor(
		private navigationService: NavigationService,
		private accountService: AccountService,
		private instanceService: InstanceService,
		private modalService: BsModalService,
		public themeService: ThemeService,
		public timeHelperService: TimeHelperService,
		private actRoute: ActivatedRoute
	) {}

	ngOnInit(): void {
		this.navigationService.setTitle('Accounts');

		const routeData$ = this.actRoute.data;
		const queryParams$ = this.actRoute.queryParams;
		this.initPage$ = combineLatest({
			routeData: routeData$,
			queryParams: queryParams$,
		}).pipe(
			tap(response => {
				this.accountPage = response.routeData['accounts'];
				this.environment = response.queryParams['environment'];
				const accounts = response.routeData['accounts'] as SeekPage<Account>;
				this.updatePage();
				accounts.data.forEach((acc, idx) => {
					this.instanceService.countByAccountId(acc.id).subscribe(value => {
						this.tableData[idx].columns[1].content = value + '';
					});
				});
				this.getAccountsCounts();
			}),
			map(() => void 0)
		);
	}

	getAccountsCounts() {
		this.accountPage.data.forEach((acc, idx) => {
			this.instanceService.countByAccountId(acc.id).subscribe(value => {
				this.tableData[idx].columns[1].content = value + '';
			});
		});
	}

	deleteAccount(acc: Account, accountIndex: number) {
		this.bsModalRef = this.modalService.show(ConfirmDeleteModalComponent);
		this.bsModalRef.content.entityName = acc.name;
		(this.bsModalRef.content as ConfirmDeleteModalComponent).confirmState
			.pipe(
				switchMap(state => {
					return this.accountService.delete(acc.id);
				})
			)
			.subscribe({
				next: () => {
					this.accountPage?.data.splice(accountIndex, 1);
					this.bsModalRef.hide();
					this.updatePage();
				},
				error: (error: HttpErrorResponse) => {
					console.log(error);
				},
			});
	}

	addNewAccount(account: Account) {
		if (
			this.accountPage.data.filter(f => {
				return f.name === account.name;
			}).length == 0
		) {
			this.accountPage?.data.push(account);
			this.updatePage();
		}
	}

	updatePage() {
		const rows: DataRow[] = [];
		if (!this.accountPage) {
			this.loading = true;
			for (let i = 0; i < 2; ++i) {
				const columns: DataCell[] = [
					{
						content: '',
					},
					{
						align: 'center',
						content: '',
					},
					{
						content: '',
					},
					{
						content: '',
						onHover: true,
					},
				];
				rows.push({ columns: columns });
			}
		} else {
			this.loading = false;
			for (let i = 0; i < this.accountPage.data.length; ++i) {
				const columns: DataCell[] = [];
				const account = this.accountPage.data[i];
				columns.push(
					{
						content: account.name,
					},
					{
						align: 'center',
						route: {
							route: 'instances',
							extra: {
								queryParams: {
									accountName: account.name,
									environment: this.environment,
								},
							},
						},
						content: '0',
					},
					{
						content: this.timeHelperService.formatDateTime(account.epochCreationTime),
					},
					{
						content: '',
						onHover: true,
						align: 'center',
						faIcon: faTrash,
						actionToReturn: 'delete-account',
					}
				);
				rows.push({ columns: columns });
			}
		}
		this.tableData = rows;
	}

	actionHandler(result: { action: string; index: number }) {
		if (result.action === 'create-account') {
			this.bsModalRef = this.modalService.show(CreateAccountModalComponent);
			this.bsModalRef.content.created.pipe(take(1)).subscribe(value => {
				this.addNewAccount(value);
			});
		} else if (result.action === 'delete-account') {
			const account = this.accountPage?.data[result.index];
			if (account) {
				this.deleteAccount(account, result.index);
			}
		}
	}
}
