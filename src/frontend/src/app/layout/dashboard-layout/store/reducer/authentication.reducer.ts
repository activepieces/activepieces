import { createReducer, on } from '@ngrx/store';
import { ProjectAuthentication } from 'src/app/layout/common-layout/model/authentication';
import * as AuthenticationActions from '../action/authentication.action';
import { AuthenticationType } from '../../../common-layout/helper/authentication-type.enum';

export declare type AuthenticationState = {
	authentications: ProjectAuthentication[];
};
const initialState: AuthenticationState = {
	authentications: [],
};

export const authenticationReducer = createReducer(
	initialState,
	on(AuthenticationActions.fetchAuthenticationsSuccessful, (state, action): AuthenticationState => {
		return { ...state, authentications: action.authentications };
	}),
	on(AuthenticationActions.updateFirebaseProjectIdSuccessful, (state, action) => {
		const authenticationIndex = state.authentications.findIndex(
			a => a.environmentId == action.project.environmentId && a.type == AuthenticationType.FIREBASE
		);
		const newState: AuthenticationState = {
			authentications: [...state.authentications],
		};
		if (authenticationIndex === -1) {
			newState.authentications.push(action.project);
		} else {
			newState.authentications[authenticationIndex] = action.project;
		}
		return newState;
	}),
	on(AuthenticationActions.generateSigningKeySuccessful, (state, action) => {
		const authenticationIndex = state.authentications.findIndex(
			a => a.environmentId == action.signingKey.environmentId && a.type == AuthenticationType.SIGNING_KEY
		);
		const newState: AuthenticationState = {
			authentications: [...state.authentications],
		};
		if (authenticationIndex === -1) {
			newState.authentications.push(action.signingKey);
		} else {
			newState.authentications[authenticationIndex] = action.signingKey;
		}
		return newState;
	}),
	on(AuthenticationActions.clearSigningKeyCredentials, (state, action) => {
		const cleanKey = { ...action.key };
		delete cleanKey.privateKey;
		const keyIndex = state.authentications.findIndex(a => a.environmentId === action.key.environmentId);
		const cleanState: AuthenticationState = {
			authentications: [...state.authentications],
		};
		cleanState.authentications[keyIndex] = cleanKey;
		return { ...cleanState };
	})
);
