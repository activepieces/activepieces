import { Action, createReducer, on } from '@ngrx/store';
import { EventActions } from '../action/events.action';
import { EventsState } from '../model/events-state.model';

const initialState: EventsState = {
	loaded: false,
	events: [],
};

const _eventsReducer = createReducer(
	initialState,
	on(EventActions.addEvent, (state, { eventDefinition }): EventsState => {
		const clonedState: EventsState = JSON.parse(JSON.stringify(state));
		clonedState.events.push(eventDefinition);
		return clonedState;
	}),
	on(EventActions.setEvents, (state, { events }): EventsState => {
		const clonedState: EventsState = JSON.parse(JSON.stringify(state));
		clonedState.events = events;
		clonedState.loaded = true;
		return { ...clonedState };
	}),
	on(EventActions.clearEvents, (state, {}): EventsState => {
		return { loaded: false, events: [] };
	})
);

export function eventsReducer(state: EventsState | undefined, action: Action) {
	return _eventsReducer(state, action);
}
