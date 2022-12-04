import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatMap, map, of, switchMap } from 'rxjs';
import { OrganizationActions } from '../action/organizations.action';
import { ProjectService } from '../../service/project.service';
import { ProjectActions } from '../action/project.action';
import { CommonActions } from '../action/common.action';

@Injectable()
export class ProjectsEffect {
	constructor(private actions$: Actions, private projectService: ProjectService) {}

	loadInitial$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(OrganizationActions.setOrganizations),
			concatMap(({ organizations }) => {
				return this.projectService.list(organizations[0].id).pipe(
					switchMap(projects => {
						if (projects.length === 0) {
							return this.projectService.create(organizations[0].id, { displayName: 'My project' }).pipe(
								map(project => {
									return ProjectActions.setProjects({ projects: [project] });
								})
							);
						}
						return of(
							ProjectActions.setProjects({
								projects: projects,
							})
						);
					})
				);
			})
		);
	});

	clearState$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(CommonActions.clearState),
			map(({}) => {
				return ProjectActions.clearProjects();
			})
		);
	});
}
