import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of, tap } from 'rxjs';
import { CollectionActions } from 'src/app/layout/flow-builder/store/action/collection.action';
import { CollectionStateEnum } from 'src/app/layout/flow-builder/store/model/enums/collection-state.enum';
import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';

@Component({
	selector: 'app-deploy-button',
	templateUrl: './deploy-button.component.html',
	styleUrls: ['./deploy-button.component.scss'],
})
export class DeployButtonComponent implements OnInit {
	collectionState$: Observable<CollectionStateEnum>;
	isSaving: boolean = false;
	isDeploying: boolean = false;
	deploying$: Observable<boolean> = of(false);
	allFlowsValid$: Observable<boolean>;
	deployBtnText = 'Deploy';
	excutePublishBtnText = 'Deploy';
	tooltipText = 'Deploy Collection';
	executePublishBtnDisabled = true;
	aFlowIsInvalid = false;
	collectionVersionSequenceForEachEnvironment = new Map<string, string>();
	selectedEnvironments$: Observable<string[]>;
	constructor(private store: Store) {}

	executeDeployBtnStyleInit() {
		this.executePublishBtnDisabled = true;
		this.excutePublishBtnText = 'Deploy';
	}
	ngOnInit(): void {
		this.setCollectionStateListener();
		this.executeDeployBtnStyleInit();
		this.allFlowsValid$ = this.store.select(BuilderSelectors.selectFlowsValidity).pipe(
			tap(valid => {
				this.aFlowIsInvalid = !valid;
				if (this.aFlowIsInvalid) {
					this.tooltipText = 'Please make sure all flows are valid';
				} else {
					this.tooltipText = 'Deploy Collection';
				}
			})
		);
	}

	private setCollectionStateListener() {
		this.collectionState$ = this.store.select(BuilderSelectors.selectCollectionState).pipe(
			tap(state => {
				
				this.isSaving =
					(state & CollectionStateEnum.SAVING_COLLECTION) === CollectionStateEnum.SAVING_COLLECTION ||
					(state & CollectionStateEnum.SAVING_FLOW) === CollectionStateEnum.SAVING_FLOW;
				this.isDeploying = (state & CollectionStateEnum.DEPLOYING) === CollectionStateEnum.DEPLOYING;
				if (this.isDeploying) {
					this.deployBtnText = 'Deploying';
				} else if (this.isSaving) {
					this.deployBtnText = 'Saving';
				} else {
					this.deployBtnText = 'Deploy';
				}
			})
		);
	}

	deploy() {
		this.executeDeployBtnStyleInit();
		this.store.dispatch(CollectionActions.deploy());
	}
}
