import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CommonStateModel } from '../model/common-state.model';
import { DropdownItemOption } from '../../model/fields/variable/subfields/dropdown-item-option';
import { EventsState } from '../model/events-state.model';

export const COMMON_STATE = 'commonState';

export const selectCommonState = createFeatureSelector<CommonStateModel>(COMMON_STATE);

export const selectEventsState = createSelector(selectCommonState, (state: CommonStateModel) => state.eventsState);

export const selectEvents = createSelector(selectEventsState, (state: EventsState) => state.events);

export const selectEventsDropdownOptions = (selectedEventNames: string[]) =>
	createSelector(selectEventsState, (state: EventsState) => {
		const options: DropdownItemOption[] = [];
		const selectedOptions: DropdownItemOption[] = [];

		for (let i = 0; i < state.events.length; ++i) {
			const item = {
				value: state.events[i].name,
				label: state.events[i].displayName,
			};
			if (
				selectedEventNames !== undefined &&
				selectedEventNames !== null &&
				selectedEventNames.indexOf(state.events[i].name) !== -1
			) {
				selectedOptions.push(item);
			}
			options.push(item);
		}

		return { options: options, selected: selectedOptions };
	});

export const CommonSelectors = {
	selectEvents,
	selectEventsDropdownOptions,
};
