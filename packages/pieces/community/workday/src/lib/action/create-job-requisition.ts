import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const createJobRequisition = createAction({
	auth: workdayAuth,
	name: 'create_job_requisition',
	displayName: 'Create Job Requisition',
	description: 'Creates a new job requisition in Workday.',
	props: {
		supervisoryOrganizationId: Property.ShortText({
			displayName: 'Supervisory Organization ID',
			description: 'The supervisory organization for the requisition.',
			required: true,
		}),
		reasonId: Property.ShortText({
			displayName: 'Reason ID',
			description: 'The reason for creating the requisition.',
			required: true,
		}),
		jobPostingTitle: Property.ShortText({
			displayName: 'Job Posting Title',
			description: 'The title for the job posting.',
			required: true,
		}),
		numberOfOpenings: Property.Number({
			displayName: 'Number of Openings',
			description: 'Number of openings (default: 1).',
			required: false,
			defaultValue: 1,
		}),
		jobProfileId: Property.ShortText({
			displayName: 'Job Profile ID',
			description: 'Job profile reference ID.',
			required: false,
		}),
		primaryLocationId: Property.ShortText({
			displayName: 'Primary Location ID',
			description: 'Primary location reference ID.',
			required: false,
		}),
		recruitingStartDate: Property.ShortText({
			displayName: 'Recruiting Start Date',
			description: 'Date to start recruiting (YYYY-MM-DD).',
			required: false,
		}),
		targetHireDate: Property.ShortText({
			displayName: 'Target Hire Date',
			description: 'Target date for hiring (YYYY-MM-DD).',
			required: false,
		}),
	},
	async run(ctx) {
		const {
			supervisoryOrganizationId,
			reasonId,
			jobPostingTitle,
			numberOfOpenings,
			recruitingStartDate,
			targetHireDate,
		} = ctx.propsValue;

		const escapeXml = (s: string) =>
			s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');

		const openings = numberOfOpenings ?? 1;

		let recruitingStartDateXml = '';
		if (recruitingStartDate) {
			recruitingStartDateXml = `
            <bsvc:Recruiting_Start_Date>${escapeXml(recruitingStartDate)}</bsvc:Recruiting_Start_Date>`;
		}

		let targetHireDateXml = '';
		if (targetHireDate) {
			targetHireDateXml = `
            <bsvc:Target_Hire_Date>${escapeXml(targetHireDate)}</bsvc:Target_Hire_Date>`;
		}

		const operationXml = `
    <bsvc:Create_Requisition_Request bsvc:version="v46.0" xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Business_Process_Parameters>
        <bsvc:Auto_Complete>true</bsvc:Auto_Complete>
        <bsvc:Run_Now>true</bsvc:Run_Now>
      </bsvc:Business_Process_Parameters>
      <bsvc:Create_Job_Requisition_Data>
        <bsvc:Supervisory_Organization_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(supervisoryOrganizationId)}</bsvc:ID>
        </bsvc:Supervisory_Organization_Reference>
        <bsvc:Create_Job_Requisition_Reason_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(reasonId)}</bsvc:ID>
        </bsvc:Create_Job_Requisition_Reason_Reference>
        <bsvc:Job_Requisition_Data>
          <bsvc:Job_Posting_Title>${escapeXml(jobPostingTitle)}</bsvc:Job_Posting_Title>
          <bsvc:Number_of_Openings>${openings}</bsvc:Number_of_Openings>${recruitingStartDateXml}${targetHireDateXml}
        </bsvc:Job_Requisition_Data>
      </bsvc:Create_Job_Requisition_Data>
    </bsvc:Create_Requisition_Request>`;

		return workdaySoapRequest(
			ctx.auth as OAuth2PropertyValue,
			'Recruiting',
			operationXml,
		);
	},
});
