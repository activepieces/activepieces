import { zagomailAuth } from '../../';
import { createAction } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';
import { listFields, listUId } from '../common/props';
import { isNil } from '@activepieces/shared';
import dayjs from 'dayjs';

export const createSubscriber = createAction({
	auth: zagomailAuth,
	name: 'createSubscriber',
	displayName: 'Create Subscriber',
	description: 'Creates a new subscriber in a list.',
	props: {
		listUId: listUId,
		fields: listFields(true),
	},
	async run({ propsValue, auth }) {
		const listUId = propsValue.listUId;
		const listFields = propsValue.fields ?? {};

		const payload: Record<string, any> = {};

		for (const [key, value] of Object.entries(listFields)) {
			if (isNil(value) || value === '') continue;

			const [field, type] = key.split(':::');

			let formattedValue = value;

			if (type === 'Date') {
				formattedValue = dayjs(value).format('YYYY-MM-DD');
			} else if (type === 'Datetime') {
				formattedValue = dayjs(value).format('YYYY-MM-DD HH:mm:ss');
			}

			payload[field] = formattedValue;
		}

		return await zagoMailApiService.createSubscriber(auth, listUId, payload);
	},
});
