import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fadeInUp400ms } from '../../../animation/fade-in-up.animation';
import { Collection, CollectionVersion } from '../../../model/piece.interface';
import { UUID } from 'angular2-uuid';
import { AccountService } from '../../../service/account.service';
import { CollectionService } from '../../../service/collection.service';
import { FlowService } from '../../../service/flow.service';
import { DropdownItemOption } from '../../../model/fields/variable/subfields/dropdown-item-option';
import { distinctUntilChanged, forkJoin, map, Observable, shareReplay, switchMap, takeUntil, tap } from 'rxjs';

import { DropdownOption } from '../../../model/dynamic-controls/dropdown-options';
import { FlowVersion } from '../../../model/flow-version.class';
import { Store } from '@ngrx/store';
import { EnvironmentSelectors } from '../../../store/selector/environment.selector';
import { ProjectEnvironment } from '../../../model/project-environment.interface';

export interface DeployStepSelectTargetEmittedValue {
	collectionVersion: CollectionVersion;
	accountId: UUID;
	flowsVersions: FlowVersion[];
	accountName: string;
	environmentName: string;
}

@Component({
	selector: 'app-select-deployment-environment',
	templateUrl: './select-deployment-environment-step.component.html',
	styleUrls: ['./select-deployment-environment-step.component.css'],
	animations: [fadeInUp400ms],
})
export class SelectDeploymentEnvironmentStepComponent implements OnInit {
	selectDeploymentEnvironmentForm: FormGroup;
	environmentDropdownOptions$: Observable<DropdownItemOption[]>;

	collectionVersionsDropdownPlaceHolder = 'Please Select';
	accountsDropdownPlaceHolder = 'Please Select';
	@Input() loading = false;
	submitted = false;
	accountsDropdownOptions$: Observable<{
		accountOptions: DropdownOption[];
		loaded: boolean;
	}>;
	@Input() collection: Collection;
	@Output() cancelClicked: EventEmitter<void> = new EventEmitter<void>();
	@Output() nextClicked: EventEmitter<any> = new EventEmitter<DeployStepSelectTargetEmittedValue>();
	destroyed$: Observable<boolean> = new Observable<boolean>();
	environmentDropdownOptions: DropdownItemOption[];
	environments: ProjectEnvironment[];

	collectionVersionDropdownOptions: DropdownItemOption[];

	constructor(
		private formBuilder: FormBuilder,
		private store: Store,
		private flowService: FlowService,
		private pieceService: CollectionService,
		private accountService: AccountService
	) {}

	ngOnInit(): void {
		this.selectDeploymentEnvironmentForm = this.formBuilder.group({
			environmentId: ['', [Validators.required]],
			collectionVersionId: ['', [Validators.required]],
			accountName: ['', [Validators.required]],
		});

		this.environmentDropdownOptions$ = this.store.select(EnvironmentSelectors.selectEnvironments).pipe(
			tap(envs => {
				this.environments = envs;
			}),
			map(envs => {
				return envs.map(env => {
					return { value: env.id, label: env.name };
				});
			}),
			tap(envOptions => {
				this.environmentDropdownOptions = envOptions;
				this.setEvnironmentIdControlListener();
				if (envOptions.length == 0) {
				} else {
					this.getControl('environmentId')?.setValue(envOptions[0].value);
				}
			})
		);
	}

	setEvnironmentIdControlListener() {
		const environmentDropdownControl = this.getControl('environmentId');
		environmentDropdownControl!.valueChanges
			.pipe(distinctUntilChanged(), takeUntil(this.destroyed$))
			.subscribe((envId: UUID) => {
				this.setCollectionVersionsPublishedForEnvironment(envId);
				this.setEnvrionmentAccounts(envId);
			});
	}

	setCollectionVersionsPublishedForEnvironment(environmentId: UUID) {
		const env = this.environments.find(env => env.id === environmentId)!;
		const publishedCollectionInEnvironment = env.deployedCollections.find(
			collection => collection.collectionId == this.collection.id
		)!;
		const publishedCollectionVersions = this.collection.versionsList.filter(collectionVersionId => {
			return !!publishedCollectionInEnvironment.collectionVersionsId.find(
				publishedCollectionVersionId => collectionVersionId === publishedCollectionVersionId
			);
		});

		//TODO are you sure the versions always are returned in the same order?
		this.collectionVersionDropdownOptions = publishedCollectionVersions.map(publishedCollectionVersionId => {
			const idx = this.collection.versionsList.findIndex(
				collectionVersionId => collectionVersionId === publishedCollectionVersionId
			);
			return {
				label: `Version ${idx + 1}`,
				value: publishedCollectionVersionId,
			};
		});
		if (this.collectionVersionDropdownOptions.length === 0) {
			this.collectionVersionsDropdownPlaceHolder = `This Collection Is Not Published on ${env.name}`;
			this.getControl('collectionVersionId')!.setValue(null);
			this.getControl('collectionVersionId')!.setErrors(null);
		} else {
			this.collectionVersionsDropdownPlaceHolder = `Please Select`;
			this.getControl('collectionVersionId')!.setValue(this.collectionVersionDropdownOptions[0].value);
			this.getControl('collectionVersionId')!.setErrors(null);
		}
	}

	setEnvrionmentAccounts(environmentId: UUID) {
		const environment = this.environments.find(f => f.id === environmentId)!;
		this.getControl('accountName')?.setValue(null);
		this.accountsDropdownPlaceHolder = 'Loading';
		this.accountsDropdownOptions$ = this.accountService.list(environmentId, 9999).pipe(
			map(accounts => {
				const dropdownOptions: DropdownItemOption[] = accounts.data.map(acc => {
					return { value: acc.name, label: acc.name };
				});
				return { accountOptions: dropdownOptions, loaded: true };
			}),
			tap(result => {
				if (result.accountOptions.length == 0) {
					this.accountsDropdownPlaceHolder = `No accounts on ${environment?.name}`;
				} else {
					this.accountsDropdownPlaceHolder = 'Please Select';
					this.getControl('accountName')?.setValue(result.accountOptions[0].value);
				}
			})
		);
	}

	nextStep() {
		this.submitted = true;
		if (this.selectDeploymentEnvironmentForm.invalid) {
			return;
		}
		if (this.loading) {
			return;
		}
		const accountName = this.selectDeploymentEnvironmentForm.get('accountName')!.value;

		this.loading = true;

		const collectionVersion$ = this.pieceService
			.getVersion(this.selectDeploymentEnvironmentForm.get('collectionVersionId')!.value)
			.pipe(shareReplay());

		const flowsVersions$ = collectionVersion$.pipe(
			switchMap(version => {
				return this.flowService.listByPieceVersion(version);
			})
		);
		const account$ = this.accountService.getByNameAndEnvironment(
			this.selectDeploymentEnvironmentForm.get('environmentId')!.value,
			accountName
		);
		const joinedRequests$ = forkJoin({
			collectionVersion: collectionVersion$,
			flowsVersions: flowsVersions$,
			account: account$,
		});
		const environmentName = this.environmentDropdownOptions.find(
			ev => ev.value == this.selectDeploymentEnvironmentForm.get('environmentId')!.value
		)!.label;
		joinedRequests$.subscribe({
			next: response => {
				this.loading = false;
				const valueToPassToNextStep: DeployStepSelectTargetEmittedValue = {
					accountId: response.account.id,
					flowsVersions: response.flowsVersions,
					collectionVersion: response.collectionVersion,
					environmentName: environmentName,
					accountName: accountName,
				};
				this.loading = false;
				this.nextClicked.emit(valueToPassToNextStep);
			},
			error: err => {
				this.loading = false;
				console.log(err);
			},
		});
	}

	getControl(controlName: string) {
		return this.selectDeploymentEnvironmentForm.get(controlName);
	}
}
