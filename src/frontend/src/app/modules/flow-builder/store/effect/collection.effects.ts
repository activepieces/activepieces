import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, concatLatestFrom } from '@ngrx/effects';
import { catchError, debounceTime, of, tap } from 'rxjs';
import { concatMap, filter, map, switchMap } from 'rxjs/operators';
import { CollectionActions, CollectionModifyingState, savedFailed, savedSuccess } from '../action/collection.action';
import { CollectionService } from '../../../common/service/collection.service';
import { Store } from '@ngrx/store';
import { CollectionBuilderService } from '../../service/collection-builder.service';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { BuilderSelectors } from '../selector/flow-builder.selector';
import { SingleFlowModifyingState } from '../action/flows.action';
import { BuilderActions } from '../action/builder.action';

import { autoSaveDebounceTime } from 'src/app/modules/common/utils';
import { VersionEditState } from 'src/app/modules/common/model/enum/version-edit-state.enum';
import { AuthenticationService } from 'src/app/modules/common/service/authentication.service';
import { PosthogService } from 'src/app/modules/common/service/posthog.service';

@Injectable()
export class CollectionEffects {
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
			map(({ collection, instance }) => {
				return CollectionActions.setInitial({
					collection: collection,
					instance: instance,
				});
			})
		);
	});

	deleteConfig$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(CollectionActions.deleteConfig),
			concatLatestFrom(action => [this.store.select(BuilderSelectors.selectCurrentCollection)]),
			concatMap(([action, collection]) => {
				return of(CollectionActions.deleteConfigSucceeded({ configIndex: action.configIndex }));
			})
		);
	});

	deleteConfigFailed$ = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(CollectionActions.deleteConfigFailed),
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

	deployFailed$ = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(CollectionActions.deployFailed),
				tap(action => {
					this.snackBar.open(`Deployment failed`, '', {
						panelClass: 'error',
						duration: 5000,
					});
				})
			);
		},
		{ dispatch: false }
	);
	deploySuccess$ = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(CollectionActions.deploySuccess),
				tap(action => {
					if (this.authenticationService.currentUserSubject.value?.track_events) {
						this.posthogService.captureEvent('collection.enable', action.instance);
					}
					this.snackBar.open(`Deployment finished`);
				})
			);
		},
		{ dispatch: false }
	);

	deploy$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(CollectionActions.deploy),
			concatLatestFrom(action => [this.store.select(BuilderSelectors.selectCurrentCollection)]),
			switchMap(([action, collection]) => {
				return this.collectionService.deploy(collection.id).pipe(
					switchMap(instance => {
						return of(CollectionActions.deploySuccess({ instance: instance }));
					}),
					catchError(err => {
						console.error(err);
						return of(CollectionActions.deployFailed());
					})
				);
			})
		);
	});

	constructor(
		private collectionBuilderService: CollectionBuilderService,
		private collectionService: CollectionService,
		private store: Store,
		private actions$: Actions,
		private snackBar: MatSnackBar,
		private authenticationService: AuthenticationService,
		private posthogService: PosthogService
	) {}
}
