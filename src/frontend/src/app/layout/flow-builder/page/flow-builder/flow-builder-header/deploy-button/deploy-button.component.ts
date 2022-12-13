import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, of } from 'rxjs';
import { CollectionActions } from 'src/app/layout/flow-builder/store/action/collection.action';
import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';

@Component({
	selector: 'app-deploy-button',
	templateUrl: './deploy-button.component.html',
	styleUrls: ['./deploy-button.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeployButtonComponent implements OnInit {
	collectionState$: Observable<{ isSaving: boolean; isDeploying: boolean }>;
	isDeployingOrIsSaving$: Observable<boolean>;
	deploying$: Observable<boolean> = of(false);
	disableDeployButton$: Observable<boolean>;
	buttonTooltipText$: Observable<string>;
	buttonText$: Observable<string>;
	constructor(private store: Store) {}

	ngOnInit(): void {
		this.setCollectionStateListener();
	}

	private setCollectionStateListener() {
		this.collectionState$ = combineLatest({
			isSaving: this.store.select(BuilderSelectors.selectIsSaving),
			isDeploying: this.store.select(BuilderSelectors.selectIsDeploying),
		});
		this.disableDeployButton$ = combineLatest({
			deploymentAndSaving: this.collectionState$,
			AllFlowsValidty: this.store.select(BuilderSelectors.selectFlowsValidity),
		}).pipe(
			map(res => {

				return !res.AllFlowsValidty || res.deploymentAndSaving.isDeploying || res.deploymentAndSaving.isSaving;
			})
		);
		this.buttonTooltipText$ = this.disableDeployButton$.pipe(
			map(res => {
				if (res) {
					return 'Please make sure all flows are valid';
				} else {
					return 'Deploy collection';
				}
			})
		);
		this.buttonText$ = this.collectionState$.pipe(
			map(res => {
				if (res.isSaving) {
					return 'Saving';
				} else if (res.isDeploying) {
					return 'Deploying';
				}
				return 'Deploy';
			})
		);
	}

	deploy() {
		this.store.dispatch(CollectionActions.deploy());
	}
}
