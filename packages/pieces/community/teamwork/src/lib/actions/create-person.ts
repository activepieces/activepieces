import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createPerson = createAction({
	name: 'create_person',
	displayName: 'Create Person',
	description: 'Create a new user/contact (name, email, invite options).',
	auth: teamworkAuth,
	props: {
		'first-name': Property.ShortText({
			displayName: 'First Name',
			required: true,
		}),
		'last-name': Property.ShortText({
			displayName: 'Last Name',
			required: true,
		}),
		'email-address': Property.ShortText({
			displayName: 'Email',
			required: true,
		}),
		'user-type': Property.StaticDropdown({
			displayName: 'User Type',
			required: true,
			options: {
				options: [
					{ label: 'Standard User', value: 'account' },
					{ label: 'Collaborator', value: 'collaborator' },
					{ label: 'Contact', value: 'contact' },
				],
			},
		}),
		'company-id': Property.Dropdown({
			displayName: 'Company',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/companies.json',
				});
				const options = res.data.companies.map((c: { id: string; name: string }) => ({
					label: c.name,
					value: c.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		sendInvite: Property.Checkbox({
			displayName: 'Send Invite',
			description: 'Send an invitation email to the new user.',
			required: false,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const body = {
			person: {
				'first-name': propsValue['first-name'],
				'last-name': propsValue['last-name'],
				'email-address': propsValue['email-address'],
				'user-type': propsValue['user-type'],
				'company-id': propsValue['company-id'],
				sendInvite: propsValue.sendInvite,
				title: propsValue.title,
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/people.json`,
			body,
		});
	},
});


