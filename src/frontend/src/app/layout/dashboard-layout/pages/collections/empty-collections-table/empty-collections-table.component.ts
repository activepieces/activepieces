import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { CollectionService } from 'src/app/layout/common-layout/service/collection.service';
import { ProjectService } from 'src/app/layout/common-layout/service/project.service';
import { Observable, switchMap, tap } from 'rxjs';
import { FlowService } from 'src/app/layout/common-layout/service/flow.service';
import { Flow } from 'src/app/layout/common-layout/model/flow.class';
import { PosthogService } from 'src/app/layout/common-layout/service/posthog.service';
import { AuthenticationService } from 'src/app/layout/common-layout/service/authentication.service';

@Component({
	selector: 'app-empty-collections-table',
	templateUrl: './empty-collections-table.component.html',
	styleUrls: ['./empty-collections-table.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyCollectionsTableComponent {
	creatingCollection = false;
	piecesPage: any;
	createCollection$: Observable<Flow>;
	constructor(
		private router: Router,
		private collectionService: CollectionService,
		private projectService: ProjectService,
		private flowService: FlowService,
		private posthogService: PosthogService,
		private authenticationService: AuthenticationService
	) {}

	createCollection() {
		if (!this.creatingCollection) {
			this.creatingCollection = true;
			const collectionDiplayName = 'Untitled';
			this.createCollection$ = this.projectService.selectedProjectAndTakeOne().pipe(
				switchMap(project => {
					return this.collectionService.create(project.id, {
						display_name: collectionDiplayName,
					});
				}),
				switchMap(collection => {
					if (this.authenticationService.currentUserSubject.value?.track_events) {
						this.posthogService.captureEvent('collection.created [Start building]', collection);
					}
					return this.flowService.create(collection.id, 'Flow 1');
				}),
				tap(flow => {
					if (this.authenticationService.currentUserSubject.value?.track_events) {
						this.posthogService.captureEvent('flow.created [Start building]', flow);
					}
					this.router.navigate(['/flows/', flow.collection_id], { queryParams: { newCollection: true } });
				})
			);
		}
	}
}
