import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { SeekPage } from '../../common/model/seek-page';
import { InstanceRun } from '../../common/model/instance-run.interface';
import { InstanceRunService } from '../../common/service/instance-run.service';
import { ProjectService } from '../../common/service/project.service';

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
