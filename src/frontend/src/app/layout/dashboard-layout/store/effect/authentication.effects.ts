import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { ProjectAuthenticationService } from '../../service/project-authentications.service';
import * as authenticationActions from '../action/authentication.action';

@Injectable()
export class AuthenticationEffects {
	constructor(private actions$: Actions, private authenticationService: ProjectAuthenticationService) {}

	updateFirebaseProjectId$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(authenticationActions.updateFirebaseProjectId),
			switchMap(action => {
				return this.authenticationService.updateFirebaseProjectId(action.projectId, action.environmentId).pipe(
					map(authentication => {
						return authenticationActions.updateFirebaseProjectIdSuccessful({
							project: authentication,
						});
					}),
					catchError(err => {
						return of(authenticationActions.updateFirebaseProjectIdFailed(err));
					})
				);
			})
		);
	});

	generatesigningKey$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(authenticationActions.generateSigningKey),
			switchMap(action => {
				console.log();
				return this.authenticationService.generateSigningKey(action.environmentId).pipe(
					map(authentication => {
						return authenticationActions.generateSigningKeySuccessful({
							signingKey: authentication,
						});
					}),
					catchError(err => {
						return of(authenticationActions.generateSigningKeyFailed(err));
					})
				);
			})
		);
	});
}
