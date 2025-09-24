import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const createCompany = createAction({
	name: 'create_company',
	displayName: 'Create Company',
	description: 'Create a new company in Teamwork.',
	auth: teamworkAuth,
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		website: Property.ShortText({ displayName: 'Website', required: false }),
		addressOne: Property.ShortText({ displayName: 'Address 1', required: false }),
		addressTwo: Property.ShortText({ displayName: 'Address 2', required: false }),
		city: Property.ShortText({ displayName: 'City', required: false }),
		state: Property.ShortText({ displayName: 'State', required: false }),
		zip: Property.ShortText({ displayName: 'Zip Code', required: false }),
		countrycode: Property.ShortText({
			displayName: 'Country Code',
			description: '2-letter ISO country code',
			required: false,
		}),
		phone: Property.ShortText({ displayName: 'Phone', required: false }),
		fax: Property.ShortText({ displayName: 'Fax', required: false }),
		emailOne: Property.ShortText({ displayName: 'Email 1', required: false }),
		emailTwo: Property.ShortText({ displayName: 'Email 2', required: false }),
		emailThree: Property.ShortText({ displayName: 'Email 3', required: false }),
		profile: Property.LongText({ displayName: 'Profile', required: false }),
		privateNotes: Property.LongText({ displayName: 'Private Notes', required: false }),
		customFields: Property.DynamicProperties({
			displayName: 'Custom Fields',
			required: false,
			refreshers: [],
			props: async ({ auth }) => {
				if (!auth) return {};

				const fields: DynamicPropsValue = {};
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/projects/api/v3/customfields.json',
					query: {
						entities: 'companies',
					},
				});

				if (res.data?.customfields) {
					for (const field of res.data.customfields) {
						fields[field.id] = Property.ShortText({
							displayName: field.name,
							required: field.required,
						});
					}
				}
				return fields;
			},
		}),
	},

	async run({ auth, propsValue }) {
		const customFields = Object.entries(propsValue.customFields ?? {}).map(
			([customfieldId, value]) => ({ customfieldId: parseInt(customfieldId), value })
		);

		const companyData: any = {
			name: propsValue.name,
			website: propsValue.website,
			addressOne: propsValue.addressOne,
			addressTwo: propsValue.addressTwo,
			city: propsValue.city,
			state: propsValue.state,
			zip: propsValue.zip,
			countrycode: propsValue.countrycode,
			phone: propsValue.phone,
			fax: propsValue.fax,
			emailOne: propsValue.emailOne,
			emailTwo: propsValue.emailTwo,
			emailThree: propsValue.emailThree,
			profile: propsValue.profile,
			privateNotes: propsValue.privateNotes,
		};

		if (customFields.length > 0) {
			companyData.customFields = {
				Values: customFields,
			};
		}

		const body = { company: companyData };
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/projects/api/v3/companies.json`,
			body,
		});
	},
});


