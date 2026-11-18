import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

const DEFAULT_HIRE_REASON_ID = 'Hire_Employee_Hire_Employee_New_Hire';
const DEFAULT_EMPLOYEE_TYPE_ID = 'Regular';

export const hireEmployeeAction = createAction({
	auth: workdayAuth,
	name: 'hire_employee',
	classification: 'WRITE',
	displayName: 'Hire Employee',
	description: 'Creates a new worker (hire) in Workday.',
	audience: 'both',
	aiMetadata: {
		description:
			'Initiates and auto-completes a Hire Employee business process, converting an existing applicant/pre-hire (by WID) into a worker effective on a hire date, optionally filling a specific position. Use after a pre-hire record exists to formally hire the candidate. Not idempotent: each call submits a new hire event.',
		idempotent: false,
	},
	props: {
		applicantId: Property.ShortText({
			displayName: 'Applicant / Pre-Hire ID',
			description: 'The ID of the pre-hire or applicant to hire.',
			required: true,
		}),
		hireDate: Property.ShortText({
			displayName: 'Hire Date',
			description: 'Hire date (YYYY-MM-DD).',
			required: true,
		}),
		jobProfileId: Property.ShortText({
			displayName: 'Job Profile ID',
			description: 'Job profile reference ID.',
			required: false,
		}),
		supervisoryOrganizationId: Property.ShortText({
			displayName: 'Supervisory Organization ID',
			description: 'Supervisory organization reference ID.',
			required: false,
		}),
		positionId: Property.ShortText({
			displayName: 'Position ID',
			description: 'Position reference ID.',
			required: false,
		}),
		hireReasonId: Property.ShortText({
			displayName: 'Hire Reason ID',
			description:
				'Hire reason reference ID (General_Event_Subcategory_ID), e.g. `Hire_Employee_Hire_Employee_New_Hire`.',
			required: false,
			defaultValue: DEFAULT_HIRE_REASON_ID,
		}),
		employeeTypeId: Property.ShortText({
			displayName: 'Employee Type ID',
			description: 'Employee type reference ID (Employee_Type_ID), e.g. `Regular`.',
			required: false,
			defaultValue: DEFAULT_EMPLOYEE_TYPE_ID,
		}),
	},
	async run({ auth, propsValue }) {
		return await workdayApi.hireEmployee({
			auth,
			applicantId: propsValue.applicantId,
			hireDate: propsValue.hireDate,
			positionId: propsValue.positionId,
			supervisoryOrganizationId: propsValue.supervisoryOrganizationId,
			jobProfileId: propsValue.jobProfileId,
			hireReasonId: propsValue.hireReasonId || DEFAULT_HIRE_REASON_ID,
			employeeTypeId: propsValue.employeeTypeId || DEFAULT_EMPLOYEE_TYPE_ID,
		});
	},
});
