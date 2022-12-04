import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Collection } from '../../model/piece.interface';
import { DeployStepSelectTargetEmittedValue } from './select-targeted-environment-step/select-deployment-environment-step.component';
import { DeployModalStep } from '../../model/enum/deploy-modal-step.enum';
import { InstanceService } from '../../service/instance.service';
import { InstanceStatus } from '../../model/enum/instance-status';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Instance } from '../../model/instance.interface';
import { ConfigSource } from '../../model/enum/config-source';

type CollectionConfigsFormOutput = {
	[key: string]: any;
};

@Component({
	selector: 'app-deploy-modal',
	templateUrl: './deploy-modal.component.html',
	styleUrls: ['./deploy-modal.component.css'],
})
export class DeployModalComponent implements OnInit {
	@ViewChild('template') deployTemplate;

	@Input() collection: Collection;

	step: DeployModalStep = DeployModalStep.SELECT_ENVIRONMENT;
	submitted = false;
	nameExists: boolean;
	modalRef?: BsModalRef;
	onHidden$: Observable<void>;
	createInstance$: Observable<Instance>;
	deploymentDetailsByStep: Map<DeployModalStep, DeployStepSelectTargetEmittedValue | CollectionConfigsFormOutput> =
		new Map<DeployModalStep, DeployStepSelectTargetEmittedValue | CollectionConfigsFormOutput>();

	constructor(private modalService: BsModalService, private instanceService: InstanceService, private router: Router) {}

	openModal(template: TemplateRef<any>) {
		this.modalRef = this.modalService.show(template, { backdrop: 'static' });
		this.onHidden$ = this.modalRef.onHidden.pipe(
			tap(() => {
				this.reset();
			})
		);
	}

	ngOnInit() {
		this.reset();
	}

	nextStep(stepResults: DeployStepSelectTargetEmittedValue | CollectionConfigsFormOutput) {
		this.deploymentDetailsByStep.set(this.step, stepResults);
		if (this.isLastStep()) {
			if (!this.createInstance$) {
				this.createInstance();
			}
		} else {
			this.step++;
			this.skipEmptyStep();
		}
	}

	reset() {
		this.deploymentDetailsByStep = new Map<
			DeployModalStep,
			DeployStepSelectTargetEmittedValue | CollectionConfigsFormOutput
		>();
		this.step = DeployModalStep.SELECT_ENVIRONMENT;
		this.nameExists = false;
	}

	closeModal() {
		this.modalRef?.hide();
	}

	createInstance() {
		const environmentStepDetails = this.deploymentDetailsByStep.get(
			DeployModalStep.SELECT_ENVIRONMENT
		) as DeployStepSelectTargetEmittedValue;
		const collectionConfigs = this.deploymentDetailsByStep.get(DeployModalStep.COLLECTION_CONFIGS) || {};
		this.createInstance$ = this.instanceService
			.create({
				status: InstanceStatus.RUNNING,
				collectionVersionId: environmentStepDetails.collectionVersion.id,
				accountId: environmentStepDetails.accountId,
				configs: collectionConfigs,
			})
			.pipe(
				tap(() => {
					this.modalRef?.hide();
					this.router.navigate(['/instances'], {
						queryParams: {
							environment: environmentStepDetails.environmentName,
							accountName: environmentStepDetails.accountName,
						},
					});
				})
			);
	}
	isLastStep() {
		const environmentStepDetails = this.deploymentDetailsByStep.get(
			DeployModalStep.SELECT_ENVIRONMENT
		)! as DeployStepSelectTargetEmittedValue;
		const collectionConfigs = environmentStepDetails.collectionVersion.configs;
		const flowsConfigs = environmentStepDetails.flowsVersions
			.map(fv => fv.configs.filter(c => c.source !== ConfigSource.PREDEFINED))
			.flat(1);
		if (this.step === DeployModalStep.SELECT_ENVIRONMENT) {
			if (collectionConfigs.length === 0 && flowsConfigs.length === 0) {
				return true;
			}
			return false;
		}
		return true;
	}

	skipEmptyStep() {
		const environmentStepDetails = this.deploymentDetailsByStep.get(
			DeployModalStep.SELECT_ENVIRONMENT
		)! as DeployStepSelectTargetEmittedValue;
		if (
			this.step === DeployModalStep.COLLECTION_CONFIGS &&
			environmentStepDetails.collectionVersion.configs.length === 0
		)
			this.step++;
	}
	get DeployModalStep() {
		return DeployModalStep;
	}
}
