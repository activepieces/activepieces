import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { activityTypeIdProp, filterIdProp, ownerIdProp } from '../common/props';
import { pipedrivePaginatedApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export const findActivityAction = createAction({
	auth: pipedriveAuth,
	name: 'find-activity',
	displayName: 'Find Activity',
	description: 'Finds an activity by subject.',
	props: {
		subject: Property.ShortText({
			displayName: 'Subject',
			required: true,
		}),
		exactMatch: Property.Checkbox({
			displayName: 'Exact Match',
			required: false,
			defaultValue: true,
		}),
		assignTo: ownerIdProp('Assign To', false),
		type: activityTypeIdProp(false),
		filterId: filterIdProp('activity', false),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: 'Done',
						value: 1,
					},
					{
						label: 'Not Done',
						value: 0,
					},
				],
			},
		}),
	},
	async run(context) {
		const { subject, assignTo, type, filterId, status, exactMatch } = context.propsValue;

		const response = await pipedrivePaginatedApiCall<{ id: number; subject: string }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/activities',
			query: {
				sort: 'update_time DESC',
				filter_id: filterId,
				user_id: assignTo,
				type,
				done: status,
			},
		});

		if (isNil(response) || response.length === 0) {
			return {
				found: false,
				data: [],
			};
		}

		const result = [];

		for (const activity of response) {
			if (exactMatch && activity.subject === subject) {
				result.push(activity);
			} else if (!exactMatch && activity.subject.toLowerCase().includes(subject.toLowerCase())) {
				result.push(activity);
			}
		}

		return {
			found: result.length > 0,
			data: result,
		};
	},
});
