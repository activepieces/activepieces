import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealIdProp, organizationIdProp, personIdProp, productIdProp } from '../common/props';
import FormData from 'form-data';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const attachFileAction = createAction({
    auth: pipedriveAuth,
    name: 'attach-file',
    displayName: 'Attach File',
    description: 'Uploads a file and attaches it to a deal, person, organization, activity, or product using Pipedrive API v2.', 
    props: {
        file: Property.File({
            displayName: 'File',
            required: true,
        }),
        fileName: Property.ShortText({
            displayName: 'File Name',
            required: true,
        }),
        contentType: Property.ShortText({
            displayName: 'Content Type (MIME Type)',
            description: 'e.g., application/pdf, image/png, text/plain. If left empty, it will try to infer from filename.',
            required: false,
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
        const { file, fileName, contentType, dealId, personId, organizationId, productId, activityId } =
            context.propsValue;

        const formData = new FormData(); 
        formData.append('file', file.data, { filename: fileName, contentType: contentType || 'application/octet-stream' });

        if (dealId) formData.append('deal_id', dealId.toString()); 
        if (personId) formData.append('person_id', personId.toString());
        if (organizationId) formData.append('org_id', organizationId.toString());
        if (productId) formData.append('product_id', productId.toString());
        if (activityId) formData.append('activity_id', activityId.toString());

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${context.auth.data['api_domain']}/api/v1/files`, 
            body: formData,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
            headers: {
                ...formData.getHeaders(), 
            },
        });

        return response.body;
    },
});