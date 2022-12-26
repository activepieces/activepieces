import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DashboardContainerComponent } from './dashboard-container.component';
import { RouterModule } from '@angular/router';
import { DashboardLayoutRouting } from './dashboard.routing';
import { RunsComponent } from './pages/runs/runs.component';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { CommonLayoutModule } from '../common/common-layout.module';
import { CollectionsTableComponent } from './pages/collections/collections-table.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TimeagoModule } from 'ngx-timeago';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { EmptyCollectionsTableComponent } from './pages/collections/empty-collections-table/empty-collections-table.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { SidenavRoutesListComponent } from './components/sidenav-routes-list/sidenav-routes-list.component';
import { ArchiveCollectionDialogComponent } from './pages/collections/archive-collection-dialog/archive-collection-dialog.component';
import { PageTitleComponent } from './components/page-title/page-title.component';

@NgModule({
	declarations: [
		DashboardContainerComponent,
		SidenavRoutesListComponent,
		RunsComponent,
		CollectionsTableComponent,
		EmptyCollectionsTableComponent,
		UserAvatarComponent,
		ArchiveCollectionDialogComponent,
		PageTitleComponent,
	],
	imports: [
		CommonModule,
		CommonLayoutModule,
		RouterModule.forChild(DashboardLayoutRouting),
		ReactiveFormsModule,
		ProgressbarModule,
		FontAwesomeModule,
		TimeagoModule.forChild(),
		NgxSkeletonLoaderModule,
	],
	exports: [],
	providers: [],
})
export class DashboardLayoutModule {}
