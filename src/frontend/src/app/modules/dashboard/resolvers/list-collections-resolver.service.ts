import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { Collection } from '../../common/model/collection.interface';
import { CollectionService } from '../../common/service/collection.service';
import { ProjectService } from '../../common/service/project.service';
import { SeekPage } from '../../common/model/seek-page';
import { FlowService } from '../../common/service/flow.service';

@Injectable({
	providedIn: 'root',
})
export class ListCollectionResolver implements Resolve<Observable<SeekPage<Collection>>> {
	constructor(
		private flowService: FlowService,
		private projectService: ProjectService,
		private collectionService: CollectionService
	) {}

	resolve(): Observable<SeekPage<Collection>> {
		return this.projectService.selectedProjectAndTakeOne().pipe(
			switchMap(project => {
				return this.collectionService.list(project.id, 9999).pipe(
					map(f => {
						for (let i = 0; i < f.data.length; ++i) {
							f.data[i].flowCount = this.flowService.listByCollection(f.data[i].id, 9999).pipe(
								map(value => {
									return value.data.length;
								})
							);
						}
						return f;
					})
				);
			})
		);
	}
}
