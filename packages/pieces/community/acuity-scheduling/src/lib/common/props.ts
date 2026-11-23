import { DropdownState, Property, tryCatch } from '@activepieces/pieces-framework';
import { fetchAddons, fetchAppointmentTypes, fetchCalendars, fetchLabels } from '.';
import { acuitySchedulingAuth } from '../auth';

export const appointmentTypeIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		auth: acuitySchedulingAuth,
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		advanced: params.advanced,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return noAuthState();
			}
			return loadOptions({
				fetcher: () => fetchAppointmentTypes(auth.access_token),
				things: 'appointment types',
			});
		},
	});

export const calendarIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		auth: acuitySchedulingAuth,
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		advanced: params.advanced,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return noAuthState();
			}
			return loadOptions({
				fetcher: () => fetchCalendars(auth.access_token),
				things: 'calendars',
			});
		},
	});

export const addonIdsDropdown = (params: DropdownParams) =>
	Property.MultiSelectDropdown({
		auth: acuitySchedulingAuth,
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		advanced: params.advanced,
		refreshers: ['appointmentTypeID'],
		options: async ({ auth, appointmentTypeID }) => {
			if (!auth) {
				return noAuthState();
			}
			const typeId = Number(appointmentTypeID);
			if (!appointmentTypeID || !Number.isFinite(typeId)) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select an appointment type first',
				};
			}
			return loadOptions({
				fetcher: () => fetchAddons(auth.access_token, typeId),
				things: 'add-ons',
			});
		},
	});

export const labelIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		auth: acuitySchedulingAuth,
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		advanced: params.advanced,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return noAuthState();
			}
			return loadOptions({
				fetcher: () => fetchLabels(auth.access_token),
				things: 'labels',
			});
		},
	});

function noAuthState(): DropdownState<never> {
	return {
		disabled: true,
		options: [],
		placeholder: 'Connect your Acuity account first',
	};
}

async function loadOptions({
	fetcher,
	things,
}: {
	fetcher: () => Promise<Array<{ label: string; value: number }>>;
	things: string;
}): Promise<DropdownState<number>> {
	const { data, error } = await tryCatch(fetcher);
	if (error) {
		return {
			disabled: true,
			options: [],
			placeholder: `Couldn't load ${things}`,
		};
	}
	if (data.length === 0) {
		return {
			disabled: false,
			options: [],
			placeholder: `No ${things} found in Acuity`,
		};
	}
	return { disabled: false, options: data };
}

interface DropdownParams {
	displayName: string;
	description?: string;
	required: boolean;
	advanced?: boolean;
}
