import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ProjectActions } from '../action/project.action';
import { map, of, switchMap } from 'rxjs';
import { EventDefinitionService } from '../../service/events-definitions.service';
import { EventActions } from '../action/events.action';
import { CommonActions } from '../action/common.action';

@Injectable()
export class EventsEffect {
	constructor(private actions$: Actions, private eventsService: EventDefinitionService) {}

	loadInitial$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(ProjectActions.setProjects),
			switchMap(({ projects }) => {
				return this.eventsService.list(projects[0].id, 9999).pipe(
					switchMap(events => {
						return of(
							EventActions.setEvents({
								events: events.data,
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
				return EventActions.clearEvents();
			})
		);
	});
}
