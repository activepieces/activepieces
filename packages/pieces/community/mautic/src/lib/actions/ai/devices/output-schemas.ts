import { OutputSchema } from '@activepieces/pieces-framework';

import { deviceFields, deviceLeadFields, leadOwnerFields } from '../../../output-schemas';

export const mauticCreateDeviceOutputSchema: OutputSchema = {
	fields: [{ key: 'device', label: 'Device', children: deviceFields }],
};

export const mauticDeleteDeviceOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'device',
			label: 'Device',
			children: [
				{ key: 'id', label: 'ID' },
				{ key: 'lead', label: 'Lead', children: deviceLeadFields },
				{ key: 'clientInfo', label: 'Client Info' },
				{ key: 'device', label: 'Device' },
				{ key: 'deviceBrand', label: 'Device Brand' },
				{ key: 'deviceModel', label: 'Device Model' },
				{ key: 'deviceOsName', label: 'Device Os Name' },
				{ key: 'deviceOsShortName', label: 'Device Os Short Name' },
				{ key: 'deviceOsVersion', label: 'Device Os Version' },
				{ key: 'deviceOsPlatform', label: 'Device Os Platform' },
			],
		},
	],
};

export const mauticGetDeviceOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'device',
			label: 'Device',
			children: [
				{ key: 'id', label: 'ID', format: 'number' },
				{
					key: 'lead',
					label: 'Lead',
					children: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'points', label: 'Points', format: 'number' },
						{ key: 'color', label: 'Color' },
						{ key: 'title', label: 'Title' },
						{ key: 'firstname', label: 'First Name' },
						{ key: 'lastname', label: 'Last Name' },
						{ key: 'company', label: 'Company' },
						{ key: 'position', label: 'Position' },
						{ key: 'email', label: 'Email', format: 'email' },
						{ key: 'phone', label: 'Phone' },
						{ key: 'mobile', label: 'Mobile' },
						{ key: 'address1', label: 'Address 1' },
						{ key: 'address2', label: 'Address 2' },
						{ key: 'city', label: 'City' },
						{ key: 'state', label: 'State' },
						{ key: 'zipcode', label: 'Zip Code' },
						{ key: 'timezone', label: 'Timezone' },
						{ key: 'country', label: 'Country' },
						{ key: 'fields', label: 'Fields' },
						{ key: 'lastActive', label: 'Last Active', format: 'datetime' },
						{ key: 'owner', label: 'Owner', children: leadOwnerFields },
						{ key: 'ipAddresses', label: 'IP Addresses' },
						{
							key: 'tags',
							label: 'Tags',
							labelKey: 'id',
							listItems: [
								{ key: 'id', label: 'ID', format: 'number' },
								{ key: 'tag', label: 'Tag' },
								{ key: 'description', label: 'Description' },
							],
						},
						{ key: 'utmtags', label: 'UTM Tags' },
						{ key: 'stage', label: 'Stage' },
						{ key: 'dateIdentified', label: 'Date Identified', format: 'datetime' },
						{ key: 'preferredProfileImage', label: 'Preferred Profile Image' },
						{ key: 'doNotContact', label: 'Do Not Contact' },
						{ key: 'frequencyRules', label: 'Frequency Rules' },
					],
				},
				{ key: 'clientInfo', label: 'Client Info' },
				{ key: 'device', label: 'Device' },
				{ key: 'deviceBrand', label: 'Device Brand' },
				{ key: 'deviceModel', label: 'Device Model' },
				{ key: 'deviceOsName', label: 'Device Os Name' },
				{ key: 'deviceOsShortName', label: 'Device Os Short Name' },
				{ key: 'deviceOsVersion', label: 'Device Os Version' },
				{ key: 'deviceOsPlatform', label: 'Device Os Platform' },
			],
		},
	],
};

export const mauticListDevicesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'devices', label: 'Devices', labelKey: 'id', listItems: deviceFields },
	],
};
