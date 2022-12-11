import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { SeekPage } from '../../common-layout/service/seek-page';
import { InstanceRun } from '../../common-layout/model/instance-run.interface';
import { InstanceRunService } from '../../common-layout/service/instance-run.service';
import { ProjectService } from '../../common-layout/service/project.service';

@Injectable({
	providedIn: 'root',
})
export class ListInstancesRunResolver implements Resolve<Observable<SeekPage<InstanceRun>>> {
	constructor(private instanceRunService: InstanceRunService, private projectService: ProjectService) {}

	resolve(snapshot: ActivatedRouteSnapshot): Observable<SeekPage<InstanceRun>> {
		const cursor = snapshot.queryParams['cursor'];
		return this.projectService.selectedProjectAndTakeOne().pipe(
			switchMap(proj => {
				return this.instanceRunService.list(proj.id, cursor);
			})
		);
	}
}
