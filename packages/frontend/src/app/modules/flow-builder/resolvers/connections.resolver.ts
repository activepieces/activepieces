import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { AppConnectionsService } from '../../common/service/app-connections.service';
import { ProjectService } from '../../common/service/project.service';

@Injectable({
	providedIn: 'root',
})
export class ConnectionsResolver implements Resolve<boolean> {
	constructor(private appConnectionsService: AppConnectionsService, private projectService: ProjectService) {}
	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
		return this.projectService.selectedProjectAndTakeOne().pipe(
			switchMap(project => {
				return this.appConnectionsService.list({ projectId: project.id, limit: 999999 });
			}),
			map(res => {
				res.data;
			})
		);
	}
}
