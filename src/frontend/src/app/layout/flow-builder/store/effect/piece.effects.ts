import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, concatLatestFrom } from '@ngrx/effects';
import { catchError, debounceTime, EMPTY, of, tap } from 'rxjs';
import { concatMap, filter, map } from 'rxjs/operators';
import {
	PieceAction,
	CollectionActionType,
	CollectionModifyingState,
	savedFailed,
	savedSuccess,
} from '../action/piece.action';
import { CollectionService } from '../../../common-layout/service/collection.service';
import { Store } from '@ngrx/store';
import { CollectionBuilderService } from '../../service/collection-builder.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BuilderSelectors } from '../selector/flow-builder.selector';
import { SingleFlowModifyingState } from '../action/flows.action';
import { BuilderActions } from '../action/builder.action';
import { Collection } from '../../../common-layout/model/piece.interface';
import { autoSaveDebounceTime } from 'src/app/layout/common-layout/utils';
import { findRefreshedConfig } from './helper';
import { VersionEditState } from 'src/app/layout/common-layout/model/enum/version-edit-state.enum';

@Injectable()
export class PieceEffects {
	createNewVersion$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(...SingleFlowModifyingState),
			concatLatestFrom(action => [this.store.select(BuilderSelectors.selectCurrentCollection)]),
			filter(([action, collection]) => {
				return collection.last_version.state === VersionEditState.LOCKED;
			}),
			map(([action, collection]) => {
				return PieceAction.updateSettings({
					description: collection.last_version.description,
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
				return this.pieceService.update(collection.id, collection.last_version, fileLogo).pipe(
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
					const configToDelete = collection.last_version.configs[action.configIndex];
					const allConfigs = [...flow.last_version.configs, ...collection.last_version.configs];
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
		private pieceBuilderService: CollectionBuilderService,
		private pieceService: CollectionService,
		private store: Store,
		private actions$: Actions,
		private snackBar: MatSnackBar
	) {}
}
