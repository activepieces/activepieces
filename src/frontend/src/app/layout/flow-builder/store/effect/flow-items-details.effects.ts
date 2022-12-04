import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, forkJoin, map, mergeMap, of, pipe, switchMap } from 'rxjs';

import { CollectionService } from 'src/app/layout/common-layout/service/collection.service';
import { ActionMetaService } from '../../service/action-meta.service';
import { FlowItemDetailsActions } from '../action/flow-items-details.action';

@Injectable()
export class FlowItemsDetailsEffects {
	load$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowItemDetailsActions.loadFlowItemsDetails),
			switchMap(() => {
				const coreFlowItemsDetails$ = this.flowItemsDetailsService
					.getDetailsForCollectionsWeBuilt()
					.pipe(
						map(collectionsWeBuiltDetails => [
							...collectionsWeBuiltDetails,
							...this.flowItemsDetailsService.coreFlowItemsDetails,
						])
					);
				const triggerFlowItemsDetails$ = of(this.flowItemsDetailsService.triggerItemsDetails);
				const connectorsFlowItemsDetails$ = this.flowItemsDetailsService.getConnectorsFlowItemsDetails();
				const userCollectionsFlowItemsDetails$ = this.flowItemsDetailsService
					.getFlowItemDetailsForUserCollections()
					.pipe(filter(res => !!res));
				const connectorComponents$ = this.flowItemsDetailsService.getConnectorsComponents();
				return forkJoin({
					coreFlowItemsDetails: coreFlowItemsDetails$,
					triggerFlowItemsDetails: triggerFlowItemsDetails$,
					connectorsFlowItemsDetails: connectorsFlowItemsDetails$,
					userCollectionsFlowItemsDetails: userCollectionsFlowItemsDetails$,
					connectorComponentsFlowItemDetails: connectorComponents$,
				});
			}),
			pipe(
				switchMap(allFlowItemsDetails => {
					return of(
						FlowItemDetailsActions.flowItemsDetailsLoadedSuccessfully({
							flowItemsDetailsLoaded: { loaded: true, ...allFlowItemsDetails },
						})
					);
				})
			)
		);
	});
	loadOldRemoteFlowItemDetails$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowItemDetailsActions.loadOldRemoteFlowItemDetails),
			mergeMap(({ collectionVersionId }) => {
				return this.collectionService.getVersion(collectionVersionId).pipe(
					this.flowItemsDetailsService.mapCollectionVersionToFlowItemDetails,
					switchMap(oldRemoteFlowItemDetails => {
						oldRemoteFlowItemDetails.extra!.old = true;
						return of(
							FlowItemDetailsActions.oldRemoteFlowItemDetailsLoadedSuccessfully({
								oldRemoteFlowItemDetails: oldRemoteFlowItemDetails,
							})
						);
					})
				);
			})
		);
	});
	constructor(
		private actions$: Actions,
		private flowItemsDetailsService: ActionMetaService,
		private collectionService: CollectionService
	) {}
}
