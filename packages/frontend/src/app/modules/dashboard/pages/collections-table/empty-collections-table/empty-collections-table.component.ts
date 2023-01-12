import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { CollectionService } from 'src/app/modules/common/service/collection.service';
import { ProjectService } from 'src/app/modules/common/service/project.service';
import { Observable, switchMap, tap } from 'rxjs';
import { FlowService } from 'src/app/modules/common/service/flow.service';
import { PosthogService } from 'src/app/modules/common/service/posthog.service';
import { AuthenticationService } from 'src/app/modules/common/service/authentication.service';
import { Flow } from 'shared';

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
					return this.collectionService.create({
						projectId: project.id,
						displayName: collectionDiplayName,
					});
				}),
				switchMap(collection => {
					if (this.authenticationService.currentUserSubject.value?.trackEvents) {
						this.posthogService.captureEvent('collection.created [Start building]', collection);
					}
					return this.flowService.create({ collectionId: collection.id, displayName: 'Flow 1' });
				}),
				tap(flow => {
					if (this.authenticationService.currentUserSubject.value?.trackEvents) {
						this.posthogService.captureEvent('flow.created [Start building]', flow);
					}
					this.router.navigate(['/flows/', flow.collectionId], { queryParams: { newCollection: true } });
				})
			);
		}
	}
}
