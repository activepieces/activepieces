import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DashboardContainerComponent } from './dashboard-container.component';
import { RouterModule } from '@angular/router';
import { DashboardLayoutRouting } from './dashboard.routing';
import { RunsComponent } from './pages/runs-table/runs-table.component';
import { CommonLayoutModule } from '../common/common-layout.module';
import { CollectionsTableComponent } from './pages/collections-table/collections-table.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { EmptyCollectionsTableComponent } from './pages/collections-table/empty-collections-table/empty-collections-table.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { SidenavRoutesListComponent } from './components/sidenav-routes-list/sidenav-routes-list.component';
import { DeleteCollectionDialogComponent } from './pages/collections-table/delete-collection-dialog/delete-collection-dialog.component';
import { PageTitleComponent } from './components/page-title/page-title.component';

@NgModule({
	declarations: [
		DashboardContainerComponent,
		SidenavRoutesListComponent,
		RunsComponent,
		CollectionsTableComponent,
		EmptyCollectionsTableComponent,
		UserAvatarComponent,
		DeleteCollectionDialogComponent,
		PageTitleComponent,
	],
	imports: [
		CommonModule,
		CommonLayoutModule,
		RouterModule.forChild(DashboardLayoutRouting),
		ReactiveFormsModule,
		FontAwesomeModule,
		NgxSkeletonLoaderModule,
	],
	exports: [],
	providers: [],
})
export class DashboardLayoutModule {}
