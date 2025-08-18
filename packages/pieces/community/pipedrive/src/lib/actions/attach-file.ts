import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealIdProp, organizationIdProp, personIdProp, productIdProp } from '../common/props';
import FormData from 'form-data';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const attachFileAction = createAction({
	auth: pipedriveAuth,
	name: 'attach-file',
	displayName: 'Attach File',
	description: 'Uploads a file and attaches it to a deal,person,organization,activity or product.',
	props: {
		file: Property.File({
			displayName: 'File',
			required: true,
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			required: true,
		}),
		dealId: dealIdProp(false),
		personId: personIdProp(false),
		organizationId: organizationIdProp(false),
		productId: productIdProp(false),
		activityId: Property.Number({
			displayName: 'Activity ID',
			required: false,
		}),
	},
	async run(context) {
		const { file, fileName, dealId, personId, organizationId, productId, activityId } =
			context.propsValue;

		const formatData = new FormData();

		formatData.append('file', file.data, fileName);
		if (dealId) formatData.append('deal_id', dealId);
		if (personId) formatData.append('person_id', personId);
		if (organizationId) formatData.append('org_id', organizationId);
		if (productId) formatData.append('product_id', productId);
		if (activityId) formatData.append('activity_id', activityId);

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${context.auth.data['api_domain']}/api/v1/files`,
			body: formatData,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
			headers: {
				...formatData.getHeaders(),
			},
		});

		return response.body;
	},
});
