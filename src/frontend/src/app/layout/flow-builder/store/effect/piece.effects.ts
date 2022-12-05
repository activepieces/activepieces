import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, concatLatestFrom } from '@ngrx/effects';
import { catchError, debounceTime, EMPTY, forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { concatMap, filter, ignoreElements, map } from 'rxjs/operators';
import {
	PieceAction,
	CollectionActionType,
	CollectionModifyingState,
	savedFailed,
	savedSuccess,
} from '../action/piece.action';
import { CollectionService } from '../../../common-layout/service/collection.service';
import { Store } from '@ngrx/store';
import { PieceBuilderService } from '../../service/piece-builder.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BuilderSelectors } from '../selector/flow-builder.selector';
import { SingleFlowModifyingState } from '../action/flows.action';
import { BuilderActions } from '../action/builder.action';
import { Collection } from '../../../common-layout/model/piece.interface';
import { autoSaveDebounceTime } from 'src/app/layout/common-layout/utils';
import { findRefreshedConfig } from './helper';
import { VersionEditState } from 'src/app/layout/common-layout/model/enum/version-edit-state.enum';
import { ProjectEnvironment } from 'src/app/layout/common-layout/model/project-environment.interface';
import { EnvironmentService } from 'src/app/layout/common-layout/service/environment.service';

@Injectable()
export class PieceEffects {
	createNewVersion$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(...SingleFlowModifyingState),
			concatLatestFrom(action => [this.store.select(BuilderSelectors.selectCurrentCollection)]),
			filter(([action, collection]) => {
				return collection.lastVersion.state === VersionEditState.LOCKED;
			}),
			map(([action, collection]) => {
				return PieceAction.updateSettings({
					description: collection.lastVersion.description,
					logoFile: undefined,
					logoEncodedUrl: undefined,
				});
			})
		);
	});

	saving$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(...CollectionModifyingState),
			concatLatestFrom(() => this.store.select(BuilderSelectors.selectCurrentCollection)),
			debounceTime(autoSaveDebounceTime),
			concatMap(([action, collection]) => {
				let fileLogo = undefined;
				if (action.type === CollectionActionType.UPDATE_SETTINGS) {
					fileLogo = action['logoFile'];
				}
				return this.pieceService.update(collection.id, collection.lastVersion, fileLogo).pipe(
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
						this.pieceBuilderService.lastSuccessfulSaveDate = `Last saved on ${nowDate} at ${nowTime}.`;
					}),
					concatMap(piece => {
						return of(savedSuccess({ collection: piece }));
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

	publishCollection$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(PieceAction.publishCollection),
			switchMap(({ environmentIds, collection }) => {
				const publishRequests: Observable<ProjectEnvironment>[] = [];
				environmentIds.forEach(environmentId => {
					publishRequests.push(
						this.environmentService.publish(environmentId, { collectionVersionId: collection.lastVersion.id })
					);
				});
				return forkJoin(publishRequests).pipe(
					map(() => {
						return PieceAction.publishCollectionSuccess({ environmentIds: environmentIds, collection: collection });
					})
				);
			}),
			catchError(error => {
				return of(PieceAction.publishCollectionFailed({ error: error }));
			})
		);
	});

	publishCollectionSucess$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(PieceAction.publishCollectionSuccess),
			concatLatestFrom(() => this.store.select(BuilderSelectors.selectCurrentCollection)),
			switchMap(([type, collection]) => {
				collection.lastVersion.state = VersionEditState.LOCKED;
				this.snackBar.open(
					`${collection.lastVersion.displayName} V${collection.versionsList.length} published successfully`
				);
				return of(PieceAction.savedSuccess({ collection: collection }));
			})
		);
	});

	publishCollectionFailed$ = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(PieceAction.publishCollectionFailed),
				tap(({ error }) => {
					this.snackBar.open('Publish collection failed, please check your console.', '', {
						duration: 3000,
						panelClass: 'error',
					});
				}),
				ignoreElements()
			);
		},
		{ dispatch: false }
	);

	loadInitial$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(BuilderActions.loadInitial),
			map(({ piece }: { piece: Collection }) => {
				return PieceAction.setInitial({
					collection: piece,
				});
			})
		);
	});

	deleteConfig$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(PieceAction.deleteConfig),
			concatLatestFrom(action => [
				this.store.select(BuilderSelectors.selectCurrentFlow),
				this.store.select(BuilderSelectors.selectCurrentCollection),
			]),
			concatMap(([action, flow, collection]) => {
				if (flow && collection) {
					const configToDelete = collection.lastVersion.configs[action.configIndex];
					const allConfigs = [...flow.lastVersion.configs, ...collection.lastVersion.configs];
					const refreshedConfig = findRefreshedConfig(allConfigs, configToDelete);
					if (refreshedConfig) {
						return of(
							PieceAction.deleteConfigFailed({
								referenceKey: configToDelete.key,
								refreshedKey: refreshedConfig.key,
							})
						);
					}
					return of(PieceAction.deleteConfigSucceeded({ configIndex: action.configIndex }));
				}
				return EMPTY;
			})
		);
	});

	deleteConfigFailed$ = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(PieceAction.deleteConfigFailed),
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
		private pieceBuilderService: PieceBuilderService,
		private pieceService: CollectionService,
		private store: Store,
		private actions$: Actions,
		private snackBar: MatSnackBar,
		private environmentService: EnvironmentService
	) {}
}
