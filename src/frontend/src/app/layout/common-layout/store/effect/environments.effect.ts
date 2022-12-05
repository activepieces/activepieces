import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, of, switchMap } from 'rxjs';
import { ProjectActions } from '../action/project.action';
import { EnvironmentService } from '../../service/environment.service';
import { EnvironmentActions } from '../action/environment.action';
import { CommonActions } from '../action/common.action';

@Injectable()
export class EnvironmentsEffect {
	constructor(private actions$: Actions, private environmentService: EnvironmentService) {}

	loadInitial$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(ProjectActions.setProjects),
			switchMap(({ projects }) => {
				return this.environmentService.list(projects[0].id, 9999).pipe(
					switchMap(environments => {
						return of(
							EnvironmentActions.setEnvironments({
								environments: environments.data,
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
				return EnvironmentActions.clearEnvironments();
			})
		);
	});
}
