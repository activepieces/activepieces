import { createAction, props } from '@ngrx/store';
import { EventDefinition } from '../../model/event.-definition.interface';

export enum EventActionModeType {
	SET_EVENTS = '[EVENT] SET_EVENTS',
	ADD_EVENT = '[EVENT] ADD_EVENT',
	CLEAR_EVENTS = '[EVENT] CLEAR_EVENTS',
}

export const setEvents = createAction(EventActionModeType.SET_EVENTS, props<{ events: EventDefinition[] }>());

export const addEvent = createAction(EventActionModeType.ADD_EVENT, props<{ eventDefinition: EventDefinition }>());

export const clearEvents = createAction(EventActionModeType.CLEAR_EVENTS);

export const EventActions = {
	addEvent,
	setEvents,
	clearEvents,
};
