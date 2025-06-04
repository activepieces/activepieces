import { Property, createAction } from '@activepieces/pieces-framework';
import { closeAuth } from './../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeApiCall } from '../common/client';
import { customFields, statusId } from '../common/props';

export const createLead = createAction({
	auth: closeAuth,
	name: 'create_lead',
	displayName: 'Create Lead',
	description: 'Creates a new lead.',
	props: {
		name: Property.ShortText({
			displayName: 'Lead Name',
			description: 'The name of the lead/company.',
			required: true,
		}),
		url: Property.ShortText({
			displayName: 'URL',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			required: false,
		}),
		contacts: Property.Array({
			displayName: 'Contacts',
			description: 'Array of contact details for this lead',
			required: false,
			properties: {
				name: Property.ShortText({
					displayName: 'Contact Name',
					required: true,
				}),
				title: Property.ShortText({
					displayName: 'Contact Title',
					required: false,
				}),
				officePhone: Property.ShortText({
					displayName: 'Contact Office Phone',
					required: false,
				}),
				mobilePhone: Property.ShortText({
					displayName: 'Contact Mobile Phone',
					required: false,
				}),
				homePhone: Property.ShortText({
					displayName: 'Contact Home Phone',
					required: false,
				}),
				directPhone: Property.ShortText({
					displayName: 'Contact Direct Phone',
					required: false,
				}),
				faxPhone: Property.ShortText({
					displayName: 'Contact Fax Phone',
					required: false,
				}),
				otherPhone: Property.ShortText({
					displayName: 'Contact Other Phone',
					required: false,
				}),
				officeEmail: Property.ShortText({
					displayName: 'Contact Office Email',
					required: false,
				}),
				homeEmail: Property.ShortText({
					displayName: 'Contact Home Email',
					required: false,
				}),
				directEmail: Property.ShortText({
					displayName: 'Contact Direct Email',
					required: false,
				}),
				otherEmail: Property.ShortText({
					displayName: 'Contact Other Email',
					required: false,
				}),
				url: Property.ShortText({
					displayName: 'Contact URL',
					required: false,
				}),
			},
		}),
		statusId: statusId('lead', false),
		customFields: customFields('lead'),
	},
	async run(context) {
		const { name, url, description, statusId } = context.propsValue;
		const contacts = (context.propsValue.contacts as ContactInfo[]) ?? [];
		const customFields = context.propsValue.customFields ?? {};

		const transformedCustomFields = Object.fromEntries(
			Object.entries(customFields)
				.filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && v.length === 0))
				.map(([key, value]) => [`custom.${key}`, value]),
		);

		const transformedContacts = contacts.map((contact) => {
			const phoneTypes = [
				'officePhone',
				'mobilePhone',
				'homePhone',
				'directPhone',
				'faxPhone',
				'otherPhone',
			] as const;

			const emailTypes = ['officeEmail', 'homeEmail', 'directEmail', 'otherEmail'] as const;

			const phones = phoneTypes
				.filter((key) => contact[key]?.trim())
				.map((key) => ({
					type: key.replace('Phone', ''),
					phone: contact[key]!.trim(),
				}));

			const emails = emailTypes
				.filter((key) => contact[key]?.trim())
				.map((key) => ({
					type: key.replace('Email', ''),
					email: contact[key]!.trim(),
				}));

			return {
				name: contact.name?.trim(),
				title: contact.title?.trim(),
				phones: phones.length > 0 ? phones : undefined,
				emails: emails.length > 0 ? emails : undefined,
				urls: contact.url
					? [
							{
								type: 'url',
								url: contact.url,
							},
					  ]
					: [],
			};
		});

		const payload: Record<string, any> = {
			name,
			url,
			description,
			status_id: statusId,
			contacts: transformedContacts,
			...transformedCustomFields,
		};

		const response = await closeApiCall({
			accessToken: context.auth,
			method: HttpMethod.POST,
			resourceUri: '/lead/',
			body: payload,
		});

		return response;
	},
});

type ContactInfo = {
	name?: string;
	title?: string;
	officePhone?: string;
	mobilePhone?: string;
	homePhone?: string;
	directPhone?: string;
	faxPhone?: string;
	otherPhone?: string;
	officeEmail?: string;
	mobileEmail?: string;
	homeEmail?: string;
	directEmail?: string;
	faxEmail?: string;
	otherEmail?: string;
	url?: string;
};
