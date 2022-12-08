import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
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
	takeUntil,
	takeWhile,
	tap,
} from 'rxjs';
import { fadeInUp400ms } from '../../../common-layout/animation/fade-in-up.animation';
import { Flow } from '../../../common-layout/model/flow.class';
import { TriggerType } from '../../../common-layout/model/enum/trigger-type.enum';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../store/selector/flow-builder.selector';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { TestRunBarComponent } from '../../page/flow-builder/test-run-bar/test-run-bar.component';
import { Config } from 'src/app/layout/common-layout/model/fields/variable/config';
import { FlowsActions } from '../../store/action/flows.action';
import { Collection } from 'src/app/layout/common-layout/model/collection.interface';
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
	collectionConfigs$: Observable<Config[]>;
	selectedFlow$: Observable<Flow|undefined>;
	instanceRunStatusChecker$: Observable<InstanceRun>;
	executeTest$: Observable<InstanceRun | null>;
	selectedCollection$: Observable<Collection>;
	shouldDisableTestButton$: Observable<boolean>;
	testRunSnackbar: MatSnackBarRef<TestRunBarComponent>;
	testFlowButtonDisabledTooltip = '';

	constructor(
		private flowService: FlowService,
		private store: Store,
		private instanceRunService: InstanceRunService,
		private snackbar: MatSnackBar
	) {

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

	testFlow(flow: Flow, collection: Collection) {
		this.submitted = true;
		this.executeTest$ = this.flowService.execute(collection.last_version.id, flow.last_version.id, {}).pipe(
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
		this.modalRef?.hide();
		this.submitted = false;
	}

	setStatusChecker(flowId: UUID, runId: UUID) {
		
		this.instanceRunStatusChecker$ = interval(1500).pipe(
			takeUntil(this.testRunSnackbar.instance.exitButtonClicked),
			switchMap(() => this.instanceRunService.get(runId)),
			switchMap((instanceRun)=>{
				
				if(instanceRun.status!==InstanceRunStatus.RUNNING && instanceRun.logs_file_id)
				{
					
					return this.flowService.logs(instanceRun.logs_file_id).pipe(map(state=>{
						return {...instanceRun,state:state};
					}))
				}
				return of(instanceRun);
			}),
			tap(instanceRun => {		
						
				if (instanceRun.status !== InstanceRunStatus.RUNNING && instanceRun.logs_file_id){
					
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
