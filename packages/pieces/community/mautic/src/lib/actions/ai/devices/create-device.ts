import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateDeviceOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateDeviceAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_device',
	outputSchema: mauticCreateDeviceOutputSchema,
	displayName: 'Create Device',
	description: 'Creates a Mautic device.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Records a device for a contact. Contact Id and Device Type are required.',
		idempotent: false,
	},
	props: {
		lead: Property.ShortText({
			displayName: 'Contact Id',
			description: 'Numeric id of the contact who uses the device, from List Contacts.',
			required: true,
		}),
		device: Property.StaticDropdown({
			displayName: 'Device Type',
			required: true,
			options: {
				options: [
					{ label: 'Desktop', value: 'desktop' },
					{ label: 'Smartphone', value: 'smartphone' },
					{ label: 'Tablet', value: 'tablet' },
					{ label: 'Phablet', value: 'phablet' },
					{ label: 'Tv', value: 'tv' },
					{ label: 'Console', value: 'console' },
					{ label: 'Car browser', value: 'car browser' },
					{ label: 'Camera', value: 'camera' },
					{ label: 'Portable media player', value: 'portable media player' },
					{ label: 'Feature phone', value: 'feature phone' },
				],
			},
		}),
		deviceBrand: Property.ShortText({
			displayName: 'Brand',
			description: 'e.g. "AP" for Apple.',
			required: false,
		}),
		deviceModel: Property.ShortText({ displayName: 'Model', required: false }),
		deviceOsName: Property.ShortText({
			displayName: 'OS Name',
			description: 'e.g. "Mac".',
			required: false,
		}),
		deviceOsShortName: Property.ShortText({
			displayName: 'OS Short Name',
			description: 'e.g. "MAC".',
			required: false,
		}),
		deviceOsVersion: Property.ShortText({ displayName: 'OS Version', required: false }),
		deviceOsPlatform: Property.ShortText({
			displayName: 'OS Platform',
			description: 'e.g. "x64".',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other device properties, e.g. "clientInfo" as {"type": "browser", "name": "Chrome", "version": "120.0"}. The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			additionalFields,
			lead,
			device,
			deviceBrand,
			deviceModel,
			deviceOsName,
			deviceOsShortName,
			deviceOsVersion,
			deviceOsPlatform,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'devices',
			body: {
				...additionalFields,
				...spreadIfDefined('lead', lead),
				...spreadIfDefined('device', device),
				...spreadIfDefined('deviceBrand', deviceBrand),
				...spreadIfDefined('deviceModel', deviceModel),
				...spreadIfDefined('deviceOsName', deviceOsName),
				...spreadIfDefined('deviceOsShortName', deviceOsShortName),
				...spreadIfDefined('deviceOsVersion', deviceOsVersion),
				...spreadIfDefined('deviceOsPlatform', deviceOsPlatform),
			},
		});
	},
});
