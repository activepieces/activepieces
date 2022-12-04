import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, EMPTY, map, mergeMap, of, switchMap, throwError } from 'rxjs';
import { ApiKeysActions, loadApiKeysFinished } from '../action/api-keys.action';
import { ApiKeyService } from '../../../common-layout/service/api-key.service';
import { UUID } from 'angular2-uuid';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { ProjectSelectors } from '../../../common-layout/store/selector/project.selector';

@Injectable()
export class ApiKeysEffects {
	constructor(
		private store: Store,
		private actions$: Actions,
		private snackBar: MatSnackBar,
		private apiKeysService: ApiKeyService
	) {}

	loadApiKeys$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(ApiKeysActions.loadApiKeys),
			concatLatestFrom(() => this.store.select(ProjectSelectors.selectProject)),
			concatMap(([action, project]) => {
				if (project === undefined) {
					return throwError(() => new Error('Cannot load api keys, the project is not selected'));
				}
				return this.apiKeysService.list(project.id, 9999).pipe(
					map(apiKeys => {
						return loadApiKeysFinished({
							apiKeys,
						});
					}),
					catchError(err => {
						const shownBar = this.snackBar.open('Failed to delete api key, please try again.', 'Refresh', {
							duration: undefined,
							panelClass: 'error',
						});
						shownBar.afterDismissed().subscribe(() => location.reload());
						return EMPTY;
					})
				);
			})
		);
	});

	createApiKey$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(ApiKeysActions.createApiKey),
			concatLatestFrom(() => this.store.select(ProjectSelectors.selectProject)),
			mergeMap(([action, project]) => {
				if (project === undefined) {
					return throwError(() => new Error('Cannot add api key, the project is not selected'));
				}
				return this.apiKeysService.create(project.id, { name: action.name }).pipe(
					map(apiKey => {
						return ApiKeysActions.createApiKeySuccess({ apiKey: apiKey });
					})
				);
			}),
			catchError(err => {
				return of(ApiKeysActions.createApiKeyFailed({ error: err }));
			})
		);
	});

	deleteApiKey$ = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(ApiKeysActions.deleteApiKey),
				switchMap((action: { id: UUID }) => {
					return this.apiKeysService.delete(action.id).pipe(
						catchError(err => {
							const shownBar = this.snackBar.open('Failed to delete api key, please try again.', 'Refresh', {
								duration: undefined,
								panelClass: 'error',
							});
							shownBar.afterDismissed().subscribe(() => location.reload());
							return EMPTY;
						})
					);
				})
			);
		},
		{ dispatch: false }
	);
}
