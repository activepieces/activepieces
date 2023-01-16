import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, delay, map, Observable, of } from 'rxjs';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/builder/builder.selector';
import { CollectionActions } from 'src/app/modules/flow-builder/store/collection/collection.action';

@Component({
	selector: 'app-publish-button',
	templateUrl: './publish-button.component.html',
	styleUrls: ['./publish-button.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishButtonComponent implements OnInit {
	collectionState$: Observable<{ isSaving: boolean; isPublishing: boolean }>;
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
			isPublishing: this.store.select(BuilderSelectors.selectIsPublishing),
		});
		this.disableDeployButton$ = combineLatest({
			publishingSavingStates: this.collectionState$,
			AllFlowsValidty: this.store.select(BuilderSelectors.selectFlowsValidity),
		}).pipe(
			map(res => {
				return !res.AllFlowsValidty || res.publishingSavingStates.isPublishing || res.publishingSavingStates.isSaving;
			})
		);
		this.buttonTooltipText$ = this.disableDeployButton$.pipe(
			delay(100),
			map(res => {
				if (res) {
					return 'Please fix all flows';
				} else {
					return 'Publish collection';
				}
			})
		);
		this.buttonText$ = this.collectionState$.pipe(
			delay(100),
			map(res => {
				if (res.isSaving) {
					return 'Saving';
				} else if (res.isPublishing) {
					return 'Publishing';
				}
				return 'Publish';
			})
		);
	}

	publish() {
		this.store.dispatch(CollectionActions.publish());
	}
}
