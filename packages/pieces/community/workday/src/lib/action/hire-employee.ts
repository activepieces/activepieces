import { Property, createAction } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

const DEFAULT_HIRE_REASON_ID = 'Hire_Employee_Hire_Employee_New_Hire';
const DEFAULT_EMPLOYEE_TYPE_ID = 'Regular';

export const hireEmployee = createAction({
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
	async run(ctx) {
		const {
			applicantId,
			hireDate,
			positionId,
			supervisoryOrganizationId,
			jobProfileId,
		} = ctx.propsValue;
		const hireReasonId = ctx.propsValue.hireReasonId || DEFAULT_HIRE_REASON_ID;
		const employeeTypeId = ctx.propsValue.employeeTypeId || DEFAULT_EMPLOYEE_TYPE_ID;

		const escapeXml = (s: string) =>
			s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');

		let positionXml = '';
		if (positionId) {
			positionXml = `
        <bsvc:Position_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(positionId)}</bsvc:ID>
        </bsvc:Position_Reference>`;
		}

		const organizationXml = supervisoryOrganizationId
			? `
        <bsvc:Organization_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(supervisoryOrganizationId)}</bsvc:ID>
        </bsvc:Organization_Reference>`
			: '';

		const jobProfileXml = jobProfileId
			? `
            <bsvc:Job_Profile_Reference>
              <bsvc:ID bsvc:type="WID">${escapeXml(jobProfileId)}</bsvc:ID>
            </bsvc:Job_Profile_Reference>`
			: '';

		const operationXml = `
    <bsvc:Hire_Employee_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Business_Process_Parameters>
        <bsvc:Auto_Complete>true</bsvc:Auto_Complete>
        <bsvc:Run_Now>true</bsvc:Run_Now>
      </bsvc:Business_Process_Parameters>
      <bsvc:Hire_Employee_Data>
        <bsvc:Applicant_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(applicantId)}</bsvc:ID>
        </bsvc:Applicant_Reference>${organizationXml}${positionXml}
        <bsvc:Hire_Date>${escapeXml(hireDate)}</bsvc:Hire_Date>
        <bsvc:Hire_Employee_Event_Data>
          <bsvc:Hire_Reason_Reference>
            <bsvc:ID bsvc:type="General_Event_Subcategory_ID">${escapeXml(hireReasonId)}</bsvc:ID>
          </bsvc:Hire_Reason_Reference>
          <bsvc:Employee_Type_Reference>
            <bsvc:ID bsvc:type="Employee_Type_ID">${escapeXml(employeeTypeId)}</bsvc:ID>
          </bsvc:Employee_Type_Reference>
          <bsvc:First_Day_of_Work>${escapeXml(hireDate)}</bsvc:First_Day_of_Work>
          <bsvc:Position_Details>${jobProfileXml}
          </bsvc:Position_Details>
        </bsvc:Hire_Employee_Event_Data>
      </bsvc:Hire_Employee_Data>
    </bsvc:Hire_Employee_Request>`;

		return workdaySoapRequest(
			ctx.auth,
			'Staffing',
			operationXml,
		);
	},
});
