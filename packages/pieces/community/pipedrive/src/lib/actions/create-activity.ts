import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { activityCommonProps } from '../common/props';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createActivityAction = createAction({
	auth: pipedriveAuth,
	name: 'create-activity',
	displayName: 'Create Activity',
	description: 'Creates a new activity.',
	props: {
		subject: Property.ShortText({
			displayName: 'Subject',
			required: true,
		}),
		...activityCommonProps,
	},
	async run(context) {
		const {
			subject,
			organizationId,
			personId,
			dealId,
			leadId,
			assignTo,
			type,
			dueDate,
			dueTime,
			duration,
			idDone,
			isBusy,
			note,
			publicDescription,
		} = context.propsValue;

		const activityDefaultFields: Record<string, any> = {
			subject,
			org_id: organizationId,
			person_id: personId,
			deal_id: dealId,
			lead_id: leadId,
			note,
			public_description: publicDescription,
			type,
			user_id: assignTo,
			due_date: dueDate,
			due_time: dueTime,
			duration,
			done: idDone ? 1 : 0,
		};

		if (isBusy) {
			activityDefaultFields.busy_flag = isBusy === 'busy' ? true : false;
		}

		const response = await pipedriveApiCall({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/activities',
			body: activityDefaultFields,
		});

		return response;
	},
});
