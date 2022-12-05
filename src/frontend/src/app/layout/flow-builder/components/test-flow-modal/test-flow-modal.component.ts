import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FlowService } from '../../../common-layout/service/flow.service';
import { InstanceRunStatus } from '../../../common-layout/model/enum/instance-run-status';
import {
	catchError,
	combineLatest,
	interval,
	map,
	Observable,
	of,
	switchMap,
	take,
	takeUntil,
	takeWhile,
	tap,
	throwError,
} from 'rxjs';
import { fadeInUp400ms } from '../../../common-layout/animation/fade-in-up.animation';
import { Flow } from '../../../common-layout/model/flow.class';
import { TriggerType } from '../../../common-layout/model/enum/trigger-type.enum';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../store/selector/flow-builder.selector';
import { jsonValidator } from '../../../common-layout/validators/json-validator';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { TestRunBarComponent } from '../../page/flow-builder/test-run-bar/test-run-bar.component';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';
import { FlowsActions } from '../../store/action/flows.action';
import { Collection } from 'src/app/layout/common-layout/model/piece.interface';
import { initializedRun, InstanceRun } from 'src/app/layout/common-layout/model/instance-run.interface';
import { InstanceRunService } from '../../../common-layout/service/instance-run.service';
import { UUID } from 'angular2-uuid';
import { HttpStatusCode } from '@angular/common/http';

@Component({
	selector: 'app-test-flow-modal',
	templateUrl: './test-flow-modal.component.html',
	styleUrls: ['./test-flow-modal.component.scss'],
	animations: [fadeInUp400ms],
})
export class TestFlowModalComponent implements OnInit {
	submitted = false;
	instanceRunStatus$: Observable<undefined | InstanceRunStatus>;
	isSaving$: Observable<boolean> = of(false);
	modalRef?: BsModalRef;
	selectedFlowConfigs$: Observable<Config[]>;
	collectionConfigs$: Observable<Config[]>;
	selectedFlow$: Observable<Flow>;
	instanceRunStatusChecker$: Observable<InstanceRun>;
	observablesNeededToBuildForm$: Observable<{
		configs: Config[];
		flow: Flow;
		collection: Collection;
	}>;
	executeTest$: Observable<InstanceRun | null>;
	selectedCollection$: Observable<Collection>;
	shouldDisableTestButton$: Observable<boolean>;
	testFlowForm: FormGroup;
	triggerFormControl: FormControl;
	testRunSnackbar: MatSnackBarRef<TestRunBarComponent>;
	testFlowButtonDisabledTooltip = '';
	triggerPayloadPlaceHolder =
		'{\n' +
		'"name":"Spongebob",\n' +
		'"email":"spongebob@gmail.com",\n' +
		'"description":"A user has signed up"\n' +
		'}';

	constructor(
		private formBuilder: FormBuilder,
		private flowService: FlowService,
		private store: Store,
		private modalService: BsModalService,
		private instanceRunService: InstanceRunService,
		private snackbar: MatSnackBar
	) {
		this.testFlowForm = this.formBuilder.group({
			configs: new FormControl(),
		});
		this.triggerFormControl = new FormControl('', [jsonValidator]);
	}

	ngOnInit() {
		this.isSaving$ = this.store.select(BuilderSelectors.selectSavingChangeState);
		this.selectedCollection$ = this.store.select(BuilderSelectors.selectCurrentCollection);
		this.collectionConfigs$ = this.store.select(BuilderSelectors.selectUserDefinedCollectionConfigs);
		this.selectedFlowConfigs$ = this.store.select(BuilderSelectors.selectUserDefinedFlowConfigs);
		this.setupSelectedFlowListener();
		this.selectedInstanceRunStatus();
		this.shouldDisableTestButton$ = combineLatest({
			saving: this.isSaving$,
			valid: this.store.select(BuilderSelectors.selectCurrentFlowValidity),
		}).pipe(
			tap(res => {
				if (res.saving) {
					this.testFlowButtonDisabledTooltip = 'Please wait until saving is complete';
				} else if (!res.valid) {
					this.testFlowButtonDisabledTooltip = 'Please make sure all flows are valid';
				} else {
					this.testFlowButtonDisabledTooltip = '';
				}
			}),
			map(res => {
				return res.saving || !res.valid;
			})
		);
		this.createObservableNeededToCreateForm();
	}

	private setupSelectedFlowListener() {
		this.selectedFlow$ = this.store.select(BuilderSelectors.selectCurrentFlow).pipe(
			tap(flow => {
				if (flow) this.addOrRemoveEventTriggerFormControl(flow);
			}),
			switchMap(flow => {
				if (flow) {
					return of(flow);
				} else {
					return throwError(() => 'selected flow is null');
				}
			})
		);
	}

	selectedInstanceRunStatus() {
		this.instanceRunStatus$ = this.store.select(BuilderSelectors.selectCurrentFlowRunStatus);
	}

	createObservableNeededToCreateForm() {
		this.observablesNeededToBuildForm$ = combineLatest({
			flowConfigs: this.selectedFlowConfigs$,
			flow: this.selectedFlow$,
			collectionConfigs: this.collectionConfigs$,
			collection: this.selectedCollection$,
		}).pipe(
			map(res => {
				const collectionConfigs = res.collectionConfigs.map(c => {
					return {
						...c,
						collectionVersionId: res.collection.last_version.id,
					};
				});
				const flowConfigs = res.flowConfigs.map(c => {
					return {
						...c,
						flowVersionId: res.flow.last_version.id,
					};
				});

				return {
					configs: [...collectionConfigs, ...flowConfigs],
					flow: res.flow,
					collection: res.collection,
				};
			})
		);
	}

	addOrRemoveEventTriggerFormControl(flow: Flow) {
		if (
			flow.last_version.trigger?.type === TriggerType.EVENT ||
			flow.last_version.trigger?.type === TriggerType.MANUAL ||
			flow.last_version.trigger?.type === TriggerType.WEBHOOK
		) {
			this.testFlowForm.addControl('trigger', this.triggerFormControl);
		} else {
			this.testFlowForm.removeControl('trigger');
		}
	}

	openModal(template: TemplateRef<any>) {
		this.observablesNeededToBuildForm$.pipe(take(1)).subscribe(result => {
			if (
				result.configs.length === 0 &&
				result.flow.last_version.trigger?.type !== TriggerType.EVENT &&
				result.flow.last_version.trigger?.type !== TriggerType.MANUAL &&
				result.flow.last_version.trigger?.type !== TriggerType.WEBHOOK
			) {
				this.testFlow(result.flow, result.collection);
			} else {
				this.modalRef = this.modalService.show(template);
			}
		});
	}

	testFlow(flow: Flow, collection: Collection) {
		this.submitted = true;
		if (!this.testFlowForm.valid) {
			return;
		}
		const triggerControlValue = this.testFlowForm.get('trigger')?.value;
		const request = {
			configs: {
				...this.testFlowForm.get('configs')?.value,
			},
			trigger: triggerControlValue ? JSON.parse(triggerControlValue) : {},
		};

		this.executeTest$ = this.flowService.execute(collection.last_version.id, flow.last_version.id, request).pipe(
			tap({
				next: (instanceRun: InstanceRun | null) => {
					this.testRunSnackbar = this.snackbar.openFromComponent(TestRunBarComponent, {
						duration: undefined,
						data: {
							flowId: flow.id,
						},
					});
					this.store.dispatch(
						FlowsActions.setRun({
							flowId: flow.id,
							run: instanceRun !== null ? instanceRun : initializedRun,
						})
					);
					if (instanceRun && instanceRun.status === InstanceRunStatus.RUNNING) {
						this.setStatusChecker(flow.id, instanceRun.id);
					}
				},
				error: err => {
					console.error(err);
				},
			}),
			catchError(err => {
				console.error(err);
				if (err?.status == HttpStatusCode.PaymentRequired) {
					this.snackbar.open('You reached the maximum runs number allowed. Contact support to discuss your plan.', '', {
						duration: 3000,
						panelClass: 'error',
					});
				} else {
					this.snackbar.open('Instance run failed, please check your console.', '', {
						panelClass: 'error',
					});
				}
				this.store.dispatch(FlowsActions.exitRun({ flowId: flow.id }));
				return of(null);
			})
		);
		this.modalRef?.hide();
		this.submitted = false;
	}

	setStatusChecker(flowId: UUID, runId: UUID) {
		this.instanceRunStatusChecker$ = interval(1500).pipe(
			takeUntil(this.testRunSnackbar.instance.exitButtonClicked),
			switchMap(() => this.instanceRunService.get(runId)),
			tap(instanceRun => {
				// TODO SIMPLIFY after next backend release TO (instanceRun.logsUploaded === true) and !instanceRun.logsUploaded
				console.log(instanceRun.logsUploaded + ' ' + (instanceRun.logsUploaded !== false) + ' ' + instanceRun.status);
				if (instanceRun.status !== InstanceRunStatus.RUNNING && instanceRun.logsUploaded !== false) {
					this.store.dispatch(
						FlowsActions.setRun({
							flowId: flowId,
							run: instanceRun,
						})
					);
				}
			}),
			takeWhile(instanceRun => {
				return instanceRun.status === InstanceRunStatus.RUNNING || !(instanceRun.logsUploaded !== false);
			})
		);
	}

	public get triggerType() {
		return TriggerType;
	}

	public get statusEnum() {
		return InstanceRunStatus;
	}
}
