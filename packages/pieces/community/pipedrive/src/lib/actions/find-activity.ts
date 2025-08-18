import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { activityTypeIdProp, filterIdProp, ownerIdProp } from '../common/props';
import { pipedrivePaginatedV2ApiCall } from '../common';
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

		const response = await pipedrivePaginatedV2ApiCall<{
			id: number;
			subject: string;
			type: string;
		}>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/activities',
			query: {
				owner_id: assignTo,
				done: status != null ? status === 1 : undefined,
				sort_by: 'update_time',
				sort_direction: 'desc',
				filter_id: filterId,
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
			let matched = false;

			if (activity.subject) {
				if (exactMatch && activity.subject === subject) {
					matched = true;
				} else if (!exactMatch && activity.subject.toLowerCase().includes(subject.toLowerCase())) {
					matched = true;
				}
			}

			// If type is provided, require both subject & type match
			if (type) {
				if (matched && activity.type === type) {
					result.push(activity);
				}
			} else {
				if (matched) {
					result.push(activity);
				}
			}
		}

		return {
			found: result.length > 0,
			data: result,
		};
	},
});
