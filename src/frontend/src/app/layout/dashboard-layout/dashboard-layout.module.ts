import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from './dashboard-layout.component';
import { RouterModule } from '@angular/router';
import { DashboardLayoutRouting } from './dashboard-layout.routing';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RunsComponent } from './pages/runs/runs.component';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { AccountsComponent } from './pages/accounts/accounts.component';
import { InstancesComponent } from './pages/instances/instances.component';
import { CommonLayoutModule } from '../common-layout/common-layout.module';
import { EnvironmentFilterComponent } from './components/environment-filter/environment-filter.component';
import { CollectionComponent } from './pages/collections/collection-components.component';
import { ListPiecesResolver } from './resolvers/list-pieces-resolver.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiKeysComponent } from './pages/api-keys/api-keys.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TimeagoModule } from 'ngx-timeago';
import { AccountsFilterComponent } from './components/accounts-filter/accounts-filter.component';
import { FilterBarComponent } from './components/filter-bar/filter-bar.component';
import { InstancesFilterComponent } from './components/instances-filter/instances-filter.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { EmptyCollectionsTableComponent } from './pages/collections/empty-collections-table/empty-collections-table.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TrialCountdownComponent } from './components/trial-countdown/trial-countdown.component';
import { TrialStatusComponent } from './pages/trial-status/trial-status.component';
import { ActionReducerMap, StoreModule } from '@ngrx/store';
import { authenticationReducer, AuthenticationState } from './store/reducer/authentication.reducer';
import { EffectsModule } from '@ngrx/effects';
import { AuthenticationEffects } from './store/effect/authentication.effects';
import { CreateApiKeyModalComponent } from './components/create-api-key-modal/create-api-key-modal.component';
import { ApiKeysEffects } from './store/effect/api-keys.effects';
import { apiKeysReducer, ApiKeysState } from './store/reducer/api-keys.reducer';
import { EnvironmentsComponent } from './pages/environments/environments.component';

export interface State {
	authenticationState: AuthenticationState;
	apiKeys: ApiKeysState;
}
const DASHBOARD_FEATURE_NAME = 'dashboard';

const reducers: ActionReducerMap<State> = {
	authenticationState: authenticationReducer,
	apiKeys: apiKeysReducer,
};

@NgModule({
	declarations: [
		DashboardLayoutComponent,
		SidebarComponent,
		RunsComponent,
		AccountsComponent,
		InstancesComponent,
		EnvironmentFilterComponent,
		CollectionComponent,
		ApiKeysComponent,
		AccountsFilterComponent,
		FilterBarComponent,
		InstancesFilterComponent,
		EmptyCollectionsTableComponent,
		UserAvatarComponent,
		TrialCountdownComponent,
		TrialStatusComponent,
		CreateApiKeyModalComponent,
		EnvironmentsComponent,
	],
	imports: [
		CommonModule,
		CommonLayoutModule,
		RouterModule.forChild(DashboardLayoutRouting),
		ReactiveFormsModule,
		MatProgressSpinnerModule,
		ProgressbarModule,
		MatProgressBarModule,
		FontAwesomeModule,
		TimeagoModule.forChild(),
		NgxSkeletonLoaderModule,
		EffectsModule.forFeature([AuthenticationEffects, ApiKeysEffects]),
		StoreModule.forFeature(DASHBOARD_FEATURE_NAME, reducers),
	],
	exports: [],
	providers: [ListPiecesResolver],
})
export class DashboardLayoutModule {}
