import { Component, OnInit, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FlowService } from '../../../common/service/flow.service';
import { InstanceRunStatus } from '../../../common/model/enum/instance-run-status';
import { catchError, combineLatest, interval, map, Observable, of, switchMap, takeUntil, takeWhile, tap } from 'rxjs';
import { fadeInUp400ms } from '../../../common/animation/fade-in-up.animation';
import { Flow } from '../../../common/model/flow.class';
import { TriggerType } from '../../../common/model/enum/trigger-type.enum';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../store/selector/flow-builder.selector';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { TestRunBarComponent } from '../../page/flow-builder/test-run-bar/test-run-bar.component';
import { FlowsActions } from '../../store/action/flows.action';
import { Collection } from 'src/app/modules/common/model/collection.interface';
import { initializedRun, InstanceRun } from 'src/app/modules/common/model/instance-run.interface';
import { InstanceRunService } from '../../../common/service/instance-run.service';
import { UUID } from 'angular2-uuid';
import { HttpStatusCode } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { jsonValidator } from 'src/app/modules/common/validators/json-validator';
import jsonlint from 'jsonlint-mod';
import { PosthogService } from 'src/app/modules/common/service/posthog.service';
import { AuthenticationService } from 'src/app/modules/common/service/authentication.service';
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
	selectedFlow$: Observable<Flow | undefined>;
	instanceRunStatusChecker$: Observable<InstanceRun>;
	executeTest$: Observable<InstanceRun | null>;
	selectedCollection$: Observable<Collection>;
	shouldDisableTestButton$: Observable<boolean>;
	testRunSnackbar: MatSnackBarRef<TestRunBarComponent>;
	testFlowButtonDisabledTooltip = '';
	payloadControl: FormControl = new FormControl('{}', jsonValidator);
	codeEditorOptions = {
		lineNumbers: true,
		lineWrapping: true,
		theme: 'lucario',
		mode: 'application/ld+json',
		lint: true,
		gutters: ['CodeMirror-lint-markers'],
	};
	constructor(
		private flowService: FlowService,
		private store: Store,
		private instanceRunService: InstanceRunService,
		private snackbar: MatSnackBar,
		private modalService: BsModalService,
		private posthogService: PosthogService,
		private authenticationService: AuthenticationService
	) {
		(<any>window).jsonlint = jsonlint;
	}

	ngOnInit() {
		this.isSaving$ = this.store.select(BuilderSelectors.selectIsSaving);
		this.selectedCollection$ = this.store.select(BuilderSelectors.selectCurrentCollection);
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
	}

	private setupSelectedFlowListener() {
		this.selectedFlow$ = this.store.select(BuilderSelectors.selectCurrentFlow);
	}

	selectedInstanceRunStatus() {
		this.instanceRunStatus$ = this.store.select(BuilderSelectors.selectCurrentFlowRunStatus);
	}

	testFlowButtonClicked(flow: Flow, collection: Collection, testFlowTemplate: TemplateRef<any>) {
		this.submitted = true;
		if (flow.last_version.trigger?.type === TriggerType.WEBHOOK) {
			this.modalRef = this.modalService.show(testFlowTemplate);
		} else {
			this.executeTest(collection, flow, {});
		}
	}
	testFlowWithPayload(collection: Collection, flow: Flow) {
		if (this.payloadControl.valid) {
			this.executeTest(collection, flow, JSON.parse(this.payloadControl.value));
			this.modalRef?.hide();
		}
	}
	executeTest(collection: Collection, flow: Flow, payload: Object) {
		this.executeTest$ = this.flowService.execute(collection.last_version.id, flow.last_version.id, payload).pipe(
			tap({
				next: (instanceRun: InstanceRun) => {
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
					this.setStatusChecker(flow.id, instanceRun.id);
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
	}
	setStatusChecker(flowId: UUID, runId: UUID) {
		this.instanceRunStatusChecker$ = interval(1500).pipe(
			takeUntil(this.testRunSnackbar.instance.exitButtonClicked),
			switchMap(() => this.instanceRunService.get(runId)),
			switchMap(instanceRun => {
				if (instanceRun.status !== InstanceRunStatus.RUNNING && instanceRun.logs_file_id) {
					if (this.authenticationService.currentUserSubject.value?.track_events) {
						this.posthogService.captureEvent('flow.tested', instanceRun);
					}
					return this.flowService.logs(instanceRun.logs_file_id).pipe(
						map(state => {
							return { ...instanceRun, state: state };
						})
					);
				}
				return of(instanceRun);
			}),
			tap(instanceRun => {
				if (instanceRun.status !== InstanceRunStatus.RUNNING && instanceRun.logs_file_id) {
					this.store.dispatch(
						FlowsActions.setRun({
							flowId: flowId,
							run: instanceRun,
						})
					);
				}
			}),
			takeWhile(instanceRun => {
				return instanceRun.status === InstanceRunStatus.RUNNING;
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
