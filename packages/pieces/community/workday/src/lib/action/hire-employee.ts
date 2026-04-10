import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const hireEmployee = createAction({
	auth: workdayAuth,
	name: 'hire_employee',
	displayName: 'Hire Employee',
	description: 'Creates a new worker (hire) in Workday.',
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
	},
	async run(ctx) {
		const {
			applicantId,
			hireDate,
			positionId,
		} = ctx.propsValue;

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

		const operationXml = `
    <bsvc:Hire_Employee_Request bsvc:version="v46.0" xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Business_Process_Parameters>
        <bsvc:Auto_Complete>true</bsvc:Auto_Complete>
        <bsvc:Run_Now>true</bsvc:Run_Now>
      </bsvc:Business_Process_Parameters>
      <bsvc:Hire_Employee_Data>
        <bsvc:Applicant_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(applicantId)}</bsvc:ID>
        </bsvc:Applicant_Reference>${positionXml}
        <bsvc:Hire_Date>${escapeXml(hireDate)}</bsvc:Hire_Date>
      </bsvc:Hire_Employee_Data>
    </bsvc:Hire_Employee_Request>`;

		return workdaySoapRequest(
			ctx.auth as OAuth2PropertyValue,
			'Staffing',
			operationXml,
		);
	},
});
