import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, concatLatestFrom } from '@ngrx/effects';
import { catchError, debounceTime, of, tap } from 'rxjs';
import { concatMap, filter, map } from 'rxjs/operators';
import { collectionActions, CollectionModifyingState, savedFailed, savedSuccess } from '../action/collection.action';
import { CollectionService } from '../../../common-layout/service/collection.service';
import { Store } from '@ngrx/store';
import { CollectionBuilderService } from '../../service/collection-builder.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BuilderSelectors } from '../selector/flow-builder.selector';
import { SingleFlowModifyingState } from '../action/flows.action';
import { BuilderActions } from '../action/builder.action';
import { Collection } from '../../../common-layout/model/collection.interface';
import { autoSaveDebounceTime } from 'src/app/layout/common-layout/utils';
import { VersionEditState } from 'src/app/layout/common-layout/model/enum/version-edit-state.enum';

@Injectable()
export class PieceEffects {
	createNewVersion$ = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(...SingleFlowModifyingState),
				concatLatestFrom(action => [this.store.select(BuilderSelectors.selectCurrentCollection)]),
				filter(([action, collection]) => {
					return collection.last_version.state === VersionEditState.LOCKED;
				})
			);
		},
		{ dispatch: false }
	);

	saving$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(...CollectionModifyingState),
			concatLatestFrom(() => this.store.select(BuilderSelectors.selectCurrentCollection)),
			debounceTime(autoSaveDebounceTime),
			concatMap(([action, collection]) => {
				return this.collectionService.update(collection.id, collection.last_version).pipe(
					tap(() => {
						const now = new Date();
						const nowDate = now.toLocaleDateString('en-us', {
							month: 'long',
							day: 'numeric',
							year: 'numeric',
						});
						const nowTime = `${now.getHours().toString().padEnd(2, '0')}:${now
							.getMinutes()
							.toString()
							.padStart(2, '0')}`;
						this.collectionBuilderService.lastSuccessfulSaveDate = `Last saved on ${nowDate} at ${nowTime}.`;
					}),
					concatMap(collection => {
						return of(savedSuccess({ collection: collection }));
					}),
					catchError(error => {
						const shownBar = this.snackBar.open(
							'You have unsaved changes on this page due to network disconnection.',
							'Refresh',
							{ panelClass: 'error', duration: undefined }
						);
						shownBar.afterDismissed().subscribe(() => location.reload());
						return of(savedFailed(error));
					})
				);
			})
		);
	});

	loadInitial$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(BuilderActions.loadInitial),
			map(({ collection }: { collection: Collection }) => {
				return collectionActions.setInitial({
					collection: collection,
				});
			})
		);
	});

	deleteConfig$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(collectionActions.deleteConfig),
			concatLatestFrom(action => [this.store.select(BuilderSelectors.selectCurrentCollection)]),
			concatMap(([action, collection]) => {
				return of(collectionActions.deleteConfigSucceeded({ configIndex: action.configIndex }));
			})
		);
	});

	deleteConfigFailed$ = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(collectionActions.deleteConfigFailed),
				tap(action => {
					this.snackBar.open(`This variable can't be deleted because it's a refresher for ${action.refreshedKey}`, '', {
						panelClass: 'error',
						duration: 5000,
					});
				})
			);
		},
		{ dispatch: false }
	);

	constructor(
		private collectionBuilderService: CollectionBuilderService,
		private collectionService: CollectionService,
		private store: Store,
		private actions$: Actions,
		private snackBar: MatSnackBar
	) {}
}
