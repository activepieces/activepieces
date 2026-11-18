import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateEmployeeOutputSchema } from '../../../output-schemas';

export const createEmployeeAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_employee',
	outputSchema: quickbooksSandboxCreateEmployeeOutputSchema,
	displayName: 'Create Employee',
	description: 'Creates an employee.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an employee, needing at least a first or last name; the display name must be unique across customers, vendors and employees. With QuickBooks Payroll on, Display Name is read-only and Bill Rate is not supported. Not idempotent: each call creates a new employee.',
		idempotent: false,
	},
	props: {
		givenName: Property.ShortText({ displayName: 'First Name', description: 'Employee\'s first name.', required: false }),
		familyName: Property.ShortText({ displayName: 'Last Name', description: 'Employee\'s last name.', required: false }),
		displayName: Property.ShortText({
			displayName: 'Display Name',
			description: 'Name shown in QuickBooks lists. Built from the name parts when empty. Read-only with Payroll on.',
			required: false,
		}),
		email: Property.ShortText({ displayName: 'Email', description: 'Primary email address.', required: false }),
		phone: Property.ShortText({ displayName: 'Phone', description: 'Primary phone number, in any format.', required: false }),
		employeeNumber: Property.ShortText({ displayName: 'Employee Number', description: 'Your own id for the employee.', required: false }),
		hiredDate: quickbooksAiProps.date({ required: false, displayName: 'Hired Date', description: 'Hire date, YYYY-MM-DD.' }),
		billableTime: quickbooksAiProps.flag({
			required: false,
			displayName: 'Billable Time',
			description: 'Yes if this employee\'s time is billed to customers by default.',
		}),
		billRate: Property.Number({
			displayName: 'Bill Rate',
			description: 'Default hourly rate billed for this employee. Not supported with Payroll on.',
			required: false,
		}),
		additionalFields: quickbooksAiProps.additionalFields({
			required: false,
			description:
				'Optional JSON object with any other Employee fields, in QuickBooks\' own field names, e.g. {"PrimaryAddr": {"Line1": "45 Oak Ave", "City": "Bayshore", "CountrySubDivisionCode": "CA", "PostalCode": "94326"}}. The dedicated inputs override the same fields here.',
		}),
	},
	async run(context) {
		const {
			givenName,
			familyName,
			displayName,
			email,
			phone,
			employeeNumber,
			hiredDate,
			billableTime,
			billRate,
			additionalFields,
		} = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Employee',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						GivenName: givenName,
						FamilyName: familyName,
						DisplayName: displayName,
						PrimaryEmailAddr: email ? { Address: email } : undefined,
						PrimaryPhone: phone ? { FreeFormNumber: phone } : undefined,
						EmployeeNumber: employeeNumber,
						HiredDate: hiredDate,
						BillableTime: quickbooksUtils.flagValue({ value: billableTime, propName: 'Billable Time' }),
						BillRate: billRate,
					},
				}),
			},
		});
	},
});

