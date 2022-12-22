import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from './dashboard-layout.component';
import { RouterModule } from '@angular/router';
import { DashboardLayoutRouting } from './dashboard.routing';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RunsComponent } from './pages/runs/runs.component';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { CommonLayoutModule } from '../common/common-layout.module';
import { CollectionComponent } from './pages/collections/collection-components.component';
import { ListCollectionResolver } from './resolvers/list-collections-resolver.service';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TimeagoModule } from 'ngx-timeago';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { EmptyCollectionsTableComponent } from './pages/collections/empty-collections-table/empty-collections-table.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';

@NgModule({
	declarations: [
		DashboardLayoutComponent,
		SidebarComponent,
		RunsComponent,
		CollectionComponent,
		EmptyCollectionsTableComponent,
		UserAvatarComponent,
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
	],
	exports: [],
	providers: [ListCollectionResolver],
})
export class DashboardLayoutModule {}
