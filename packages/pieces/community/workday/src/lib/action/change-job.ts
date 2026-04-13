import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const changeJob = createAction({
	auth: workdayAuth,
	name: 'change_job',
	displayName: 'Change Job',
	description: 'Changes the job for a worker in Workday.',
	props: {
		workerId: Property.ShortText({
			displayName: 'Worker ID',
			description: 'The ID of the worker whose job to change.',
			required: true,
		}),
		effectiveDate: Property.ShortText({
			displayName: 'Effective Date',
			description: 'Effective date of the job change (YYYY-MM-DD).',
			required: true,
		}),
		reasonId: Property.ShortText({
			displayName: 'Reason ID',
			description: 'The reason for the job change.',
			required: true,
		}),
		jobProfileId: Property.ShortText({
			displayName: 'Job Profile ID',
			description: 'New job profile reference ID.',
			required: false,
		}),
		supervisoryOrganizationId: Property.ShortText({
			displayName: 'Supervisory Organization ID',
			description: 'New supervisory organization reference ID.',
			required: false,
		}),
		positionId: Property.ShortText({
			displayName: 'Position ID',
			description: 'New position reference ID.',
			required: false,
		}),
	},
	async run(ctx) {
		const {
			workerId,
			effectiveDate,
			reasonId,
			jobProfileId,
			supervisoryOrganizationId,
			positionId,
		} = ctx.propsValue;

		const escapeXml = (s: string) =>
			s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');

		let supervisoryOrgXml = '';
		if (supervisoryOrganizationId) {
			supervisoryOrgXml = `
          <bsvc:Supervisory_Organization_Reference>
            <bsvc:ID bsvc:type="WID">${escapeXml(supervisoryOrganizationId)}</bsvc:ID>
          </bsvc:Supervisory_Organization_Reference>`;
		}

		let jobDetailsXml = '';
		if (jobProfileId) {
			jobDetailsXml = `
          <bsvc:Job_Details_Data>
            <bsvc:Job_Profile_Reference>
              <bsvc:ID bsvc:type="WID">${escapeXml(jobProfileId)}</bsvc:ID>
            </bsvc:Job_Profile_Reference>
          </bsvc:Job_Details_Data>`;
		}

		let positionXml = '';
		if (positionId) {
			positionXml = `
        <bsvc:Position_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(positionId)}</bsvc:ID>
        </bsvc:Position_Reference>`;
		}

		const operationXml = `
    <bsvc:Change_Job_Request bsvc:version="v46.0" xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Business_Process_Parameters>
        <bsvc:Auto_Complete>true</bsvc:Auto_Complete>
        <bsvc:Run_Now>true</bsvc:Run_Now>
      </bsvc:Business_Process_Parameters>
      <bsvc:Change_Job_Data>
        <bsvc:Worker_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(workerId)}</bsvc:ID>
        </bsvc:Worker_Reference>${positionXml}
        <bsvc:Effective_Date>${escapeXml(effectiveDate)}</bsvc:Effective_Date>
        <bsvc:Change_Job_Detail_Data>
          <bsvc:Reason_Reference>
            <bsvc:ID bsvc:type="WID">${escapeXml(reasonId)}</bsvc:ID>
          </bsvc:Reason_Reference>${supervisoryOrgXml}${jobDetailsXml}
        </bsvc:Change_Job_Detail_Data>
      </bsvc:Change_Job_Data>
    </bsvc:Change_Job_Request>`;

		return workdaySoapRequest(
			ctx.auth as OAuth2PropertyValue,
			'Staffing',
			operationXml,
		);
	},
});
