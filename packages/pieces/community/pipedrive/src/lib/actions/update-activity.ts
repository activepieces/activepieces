import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { activityCommonProps } from '../common/props';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

export const updateActivityAction = createAction({
	auth: pipedriveAuth,
	name: 'update-activity',
	displayName: 'Update Activity',
	description: 'Updates an existing activity.',
	props: {
		activityId: Property.Number({
			displayName: 'Activity',
			required: true,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			required: false,
		}),
		...activityCommonProps,
	},
	async run(context) {
		const {
			activityId,
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
			due_time: dueTime,
			duration,
			done: idDone ? 1 : 0,
		};

		if (isBusy) {
			activityDefaultFields.busy_flag = isBusy === 'busy' ? true : false;
		}

		if (dueDate) {
			activityDefaultFields.due_date = dayjs(dueDate).format('YYYY-MM-DD');
		}

		const response = await pipedriveApiCall({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.PUT,
			resourceUri: `/activities/${activityId}`,
			body: activityDefaultFields,
		});

		return response;
	},
});
