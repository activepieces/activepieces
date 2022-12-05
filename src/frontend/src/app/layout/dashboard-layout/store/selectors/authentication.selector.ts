import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthenticationType } from 'src/app/layout/common-layout/helper/authentication-type.enum';
import { State } from '../../dashboard-layout.module';

const selectDashboardState = createFeatureSelector<State>('dashboard');
const selectAll = createSelector(selectDashboardState, state => state.authenticationState.authentications);

export const selectFirebaseAuthentications = createSelector(selectAll, authentications =>
	authentications.filter(a => a.type == AuthenticationType.FIREBASE)
);
export const selectSigningKeyAuthentications = createSelector(selectAll, authentications =>
	authentications.filter(a => a.type == AuthenticationType.SIGNING_KEY)
);
