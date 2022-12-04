import { EventDefinition } from '../../model/event.-definition.interface';

export interface EventsState {
	loaded: boolean;
	events: EventDefinition[];
}
