import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { fetchAddons, fetchAppointmentTypes, fetchCalendars, fetchLabels } from '.';

interface DropdownParams {
	displayName: string;
	description?: string;
	required: boolean;
}

export const appointmentTypeIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please authenticate first',
					options: [],
				};
			}
			const { access_token } = auth as OAuth2PropertyValue;

			return {
				disabled: false,
				options: await fetchAppointmentTypes(access_token),
			};
		},
	});

export const calendarIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please authenticate first',
					options: [],
				};
			}
			const { access_token } = auth as OAuth2PropertyValue;

			return {
				disabled: false,
				options: await fetchCalendars(access_token),
			};
		},
	});

export const addonIdsDropdown = (params: DropdownParams) =>
	Property.MultiSelectDropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: ['appointmentTypeID'],
		options: async ({ auth, appointmentTypeID }) => {
			if (!auth || !appointmentTypeID) {
				return {
					disabled: true,
					placeholder: 'Please authenticate first',
					options: [],
				};
			}
			const { access_token } = auth as OAuth2PropertyValue;

			return {
				disabled: false,
				options: await fetchAddons(access_token, appointmentTypeID as number),
			};
		},
	});

export const labelIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please authenticate first',
					options: [],
				};
			}
			const { access_token } = auth as OAuth2PropertyValue;

			return {
				disabled: false,
				options: await fetchLabels(access_token),
			};
		},
	});
