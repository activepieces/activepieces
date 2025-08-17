import { DropdownOption, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoft365PeopleAuth } from './auth';

export const microsoft365PeopleCommon = {
	// User selection properties
	userId: Property.ShortText({
		displayName: 'User ID or Principal Name',
		description: 'Optional: User ID or principal name if working with another user\'s contacts. Leave empty to work with current user.',
		required: false,
	}),

	// Contact folder properties
	contactFolderId: Property.Dropdown({
		displayName: 'Contact Folder',
		description: 'Select a contact folder to work with',
		required: false,
		refreshers: ['userId'],
		options: async ({ auth, userId }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first.',
					options: [],
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof microsoft365PeopleAuth>;

			const client = Client.initWithMiddleware({
				authProvider: {
					getAccessToken: () => Promise.resolve(authValue.access_token),
				},
			});

			const options: DropdownOption<string>[] = [
				{ label: 'Default Contacts', value: '' }
			];

			try {
				let endpoint = '/me/contactFolders';
				if (userId) {
					endpoint = `/users/${userId}/contactFolders`;
				}

				const response = await client.api(endpoint).get();
				for (const folder of response.value) {
					options.push({
						label: folder.displayName || 'Unnamed Folder',
						value: folder.id,
					});
				}
			} catch (error) {
				// If folders can't be fetched, just return default option
			}

			return {
				disabled: false,
				options: options,
			};
		},
	}),

	// Contact selection properties
	contactId: Property.Dropdown({
		displayName: 'Contact',
		description: 'Select a contact to work with',
		required: true,
		refreshers: ['userId', 'contactFolderId'],
		options: async ({ auth, userId, contactFolderId }) => {
			if (!auth) {
				return {
					disabled: true,
					placeholder: 'Please connect your account first.',
					options: [],
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof microsoft365PeopleAuth>;

			const client = Client.initWithMiddleware({
				authProvider: {
					getAccessToken: () => Promise.resolve(authValue.access_token),
				},
			});

			const options: DropdownOption<string>[] = [];

			try {
				let endpoint = '/me/contacts';
				if (userId) {
					endpoint = `/users/${userId}/contacts`;
				}
				if (contactFolderId) {
					if (userId) {
						endpoint = `/users/${userId}/contactFolders/${contactFolderId}/contacts`;
					} else {
						endpoint = `/me/contactFolders/${contactFolderId}/contacts`;
					}
				}

				const response = await client.api(endpoint).top(100).get();
				for (const contact of response.value) {
					const displayName = contact.displayName || `${contact.givenName || ''} ${contact.surname || ''}`.trim() || 'Unnamed Contact';
					options.push({
						label: displayName,
						value: contact.id,
					});
				}
			} catch (error) {
				// If contacts can't be fetched, return empty options
			}

			return {
				disabled: false,
				options: options,
			};
		},
	}),

	// Common Microsoft Graph properties
	selectProperties: Property.ShortText({
		displayName: 'Select Properties',
		description: 'Optional: Comma-separated list of properties to include in the response (e.g., "id,displayName,emailAddresses")',
		required: false,
	}),

	expandRelationships: Property.Checkbox({
		displayName: 'Expand Relationships',
		description: 'Optional: Expand relationships in the response for additional contact information',
		required: false,
		defaultValue: false,
	}),

	// Common contact properties
	givenName: Property.ShortText({
		displayName: 'Given Name',
		description: 'The first name of the contact',
		required: false,
	}),

	surname: Property.ShortText({
		displayName: 'Surname',
		description: 'The last name of the contact',
		required: false,
	}),

	displayName: Property.ShortText({
		displayName: 'Display Name',
		description: 'The display name of the contact (if not provided, will be auto-generated)',
		required: false,
	}),

	emailAddresses: Property.Array({
		displayName: 'Email Addresses',
		description: 'List of email addresses for the contact',
		required: false,
	}),

	businessPhones: Property.Array({
		displayName: 'Business Phone Numbers',
		description: 'List of business phone numbers',
		required: false,
	}),

	mobilePhone: Property.ShortText({
		displayName: 'Mobile Phone',
		description: 'Mobile phone number',
		required: false,
	}),

	homePhones: Property.Array({
		displayName: 'Home Phone Numbers',
		description: 'List of home phone numbers',
		required: false,
	}),

	jobTitle: Property.ShortText({
		displayName: 'Job Title',
		description: 'The job title of the contact',
		required: false,
	}),

	companyName: Property.ShortText({
		displayName: 'Company Name',
		description: 'The company name of the contact',
		required: false,
	}),

	department: Property.ShortText({
		displayName: 'Department',
		description: 'The department of the contact',
		required: false,
	}),

	officeLocation: Property.ShortText({
		displayName: 'Office Location',
		description: 'The office location of the contact',
		required: false,
	}),

	birthday: Property.ShortText({
		displayName: 'Birthday',
		description: 'The birthday of the contact (ISO 8601 format: YYYY-MM-DD)',
		required: false,
	}),

	notes: Property.LongText({
		displayName: 'Notes',
		description: 'Personal notes about the contact',
		required: false,
	}),

	// Change type for triggers
	changeType: Property.StaticDropdown({
		displayName: 'Change Type',
		description: 'Select which types of changes to listen for',
		required: false,
		defaultValue: 'all',
		options: {
			disabled: false,
			options: [
				{ label: 'All Changes', value: 'all' },
				{ label: 'Created Only', value: 'created' },
				{ label: 'Updated Only', value: 'updated' },
				{ label: 'Deleted Only', value: 'deleted' }
			]
		}
	}),

	// Include deleted contacts
	includeDeleted: Property.Checkbox({
		displayName: 'Include Deleted Contacts',
		description: 'Whether to include deleted contacts in the response',
		required: false,
		defaultValue: false,
	}),
}; 