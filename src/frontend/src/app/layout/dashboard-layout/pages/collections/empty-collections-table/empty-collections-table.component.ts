import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';
import { PieceAccess } from 'src/app/layout/common-layout/model/enum/piece-access';
import { CollectionService } from 'src/app/layout/common-layout/service/collection.service';
import { ProjectService } from 'src/app/layout/common-layout/service/project.service';
import { Observable, switchMap, tap } from 'rxjs';
import { FlowService } from 'src/app/layout/common-layout/service/flow.service';
import { FlowTemplateService } from 'src/app/layout/flow-builder/service/flow-template.service';
import { Flow } from 'src/app/layout/common-layout/model/flow.class';

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
		private flowTemplateService: FlowTemplateService
	) {}

	createCollection() {
		if (!this.creatingCollection) {
			this.creatingCollection = true;
			const collectionDiplayName = 'Untitled';
			const collectionName = UUID.UUID().replaceAll('-', '_');
			this.createCollection$ = this.projectService.selectedProjectAndTakeOne().pipe(
				switchMap(project => {
					return this.collectionService.create(project.id, {
						name: collectionName,
						version: {
							displayName: collectionDiplayName,
							description: 'Collection Description',
							configs: [],
							access: PieceAccess.PRIVATE,
						},
					});
				}),
				switchMap(collection => {
					return this.flowService.create(collection.id, {
						flowDisplayName: 'Flow 1',
						template: this.flowTemplateService.FLOW_EMPTY_TEMPLATE,
					});
				}),
				tap(flow => {
					this.router.navigate(['/flows/', flow.collectionId], { queryParams: { newCollection: true } });
				})
			);
		}
	}
}
