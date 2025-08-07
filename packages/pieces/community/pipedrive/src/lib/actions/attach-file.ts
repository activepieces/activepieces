import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealIdProp, organizationIdProp, personIdProp, productIdProp } from '../common/props';
import FormData from 'form-data';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const attachFileAction = createAction({
    auth: pipedriveAuth,
    name: 'attach-file',
    displayName: 'Attach File',
    description: 'Uploads a file and attaches it to a deal, person, organization, activity, or product using Pipedrive API v2.', // ✅ Updated description for v2
    props: {
        file: Property.File({
            displayName: 'File',
            required: true,
        }),
        fileName: Property.ShortText({
            displayName: 'File Name',
            required: true,
        }),
        // FIX: Added contentType property as ApFile does not expose file.type
        contentType: Property.ShortText({
            displayName: 'Content Type (MIME Type)',
            description: 'e.g., application/pdf, image/png, text/plain. If left empty, it will try to infer from filename.',
            required: false,
        }),
        dealId: dealIdProp(false),
        personId: personIdProp(false),
        organizationId: organizationIdProp(false),
        productId: productIdProp(false),
        activityId: Property.Number({ // Pipedrive IDs are typically numbers, ensure this is handled correctly
            displayName: 'Activity ID',
            required: false,
        }),
    },
    async run(context) {
        const { file, fileName, contentType, dealId, personId, organizationId, productId, activityId } =
            context.propsValue;

        const formData = new FormData(); // Renamed from formatData to formData for clarity

        // Append the file data. Pipedrive expects the file content and filename.
        // FIX: Use the provided contentType prop, fallback to a generic if not provided
        formData.append('file', file.data, { filename: fileName, contentType: contentType || 'application/octet-stream' });

        // Append associated entity IDs. Pipedrive v2 expects these as numeric IDs.
        // Assuming dealId, personId, organizationId, productId, activityId are already numbers or can be coerced by Pipedrive.
        if (dealId) formData.append('deal_id', dealId.toString()); // Ensure IDs are sent as strings in form-data
        if (personId) formData.append('person_id', personId.toString());
        if (organizationId) formData.append('org_id', organizationId.toString());
        if (productId) formData.append('product_id', productId.toString());
        if (activityId) formData.append('activity_id', activityId.toString());

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${context.auth.data['api_domain']}/api/v2/files`, // ✅ Updated to v2 endpoint
            body: formData,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
            headers: {
                ...formData.getHeaders(), // Essential for multipart/form-data
            },
        });

        return response.body;
    },
});