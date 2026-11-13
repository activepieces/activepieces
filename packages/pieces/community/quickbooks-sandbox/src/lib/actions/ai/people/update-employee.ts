import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateEmployeeOutputSchema } from '../../../output-schemas';

export const updateEmployeeAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_employee',
	outputSchema: quickbooksSandboxUpdateEmployeeOutputSchema,
	displayName: 'Update Employee',
	description: 'Changes fields of an existing employee.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the fields you set on one employee: reads the employee, applies your changes and sends the whole record back, so unset fields keep their values. Employees cannot be deleted in QuickBooks: set Active to No to deactivate one. With Payroll on, Display Name is read-only and Bill Rate is not supported. Get the id from List Employees.',
		idempotent: true,
	},
	props: {
		employeeId: quickbooksAiProps.id({
			required: true,
			displayName: 'Employee ID',
			description: 'QuickBooks employee id. Use List Employees to find it.',
		}),
		givenName: Property.ShortText({ displayName: 'First Name', description: 'New first name.', required: false }),
		familyName: Property.ShortText({ displayName: 'Last Name', description: 'New last name.', required: false }),
		displayName: Property.ShortText({
			displayName: 'Display Name',
			description: 'New display name. Must be unique across customers, vendors and employees. Read-only with Payroll on.',
			required: false,
		}),
		email: Property.ShortText({ displayName: 'Email', description: 'New primary email address.', required: false }),
		phone: Property.ShortText({ displayName: 'Phone', description: 'New primary phone number.', required: false }),
		employeeNumber: Property.ShortText({ displayName: 'Employee Number', description: 'New employee number.', required: false }),
		hiredDate: quickbooksAiProps.date({ required: false, displayName: 'Hired Date', description: 'New hire date, YYYY-MM-DD.' }),
		billableTime: quickbooksAiProps.flag({
			required: false,
			displayName: 'Billable Time',
			description: 'Yes if this employee\'s time is billed to customers by default.',
		}),
		billRate: Property.Number({
			displayName: 'Bill Rate',
			description: 'New default hourly bill rate. Not supported with Payroll on.',
			required: false,
		}),
		active: quickbooksAiProps.flag({
			required: false,
			displayName: 'Active',
			description: 'Set to No to deactivate the employee, Yes to reactivate it.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const {
			employeeId,
			givenName,
			familyName,
			displayName,
			email,
			phone,
			employeeNumber,
			hiredDate,
			billableTime,
			billRate,
			active,
			additionalFields,
		} = context.propsValue;
		return await quickbooksApi.replaceEntity({
			auth: context.auth,
			entity: 'Employee',
			id: employeeId,
			fields: quickbooksUtils.requireChanges({
				fields: {
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
							Active: quickbooksUtils.flagValue({ value: active, propName: 'Active' }),
						},
					}),
				},
			}),
		});
	},
});


