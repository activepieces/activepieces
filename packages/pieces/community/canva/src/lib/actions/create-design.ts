import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/client';
import { canvaAuth } from '../common/auth';

export const createDesignAction = createAction({
    auth: canvaAuth,
    name: 'create_design',
    displayName: 'Create Design',
    description: 'Creates a new Canva design.',
    props: {
        designType: Property.StaticDropdown({
            displayName: 'Design Type',
            description: 'Choose the design type.',
            required: true,
            options: {
                options: [
                    { label: 'Preset', value: 'preset' },
                    { label: 'Custom', value: 'custom' },
                ],
            },
        }),
        presetName: Property.StaticDropdown({
            displayName: 'Preset Name',
            description: 'Select the preset name for the design.',
            required: false,
            options: {
                options: [
                    { label: 'Doc', value: 'doc' },
                    { label: 'Whiteboard', value: 'whiteboard' },
                    { label: 'Presentation', value: 'presentation' },
                ],
            },
        }),
        width: Property.Number({
            displayName: 'Width (px)',
            description: 'Width of the custom design (Minimum: 40, Maximum: 8000). Required if design type is custom.',
            required: false,
        }),
        height: Property.Number({
            displayName: 'Height (px)',
            description: 'Height of the custom design (Minimum: 40, Maximum: 8000). Required if design type is custom.',
            required: false,
        }),
        assetId: Property.ShortText({
            displayName: 'Asset ID',
            description: 'Optional. The ID of an asset to insert into the created design.',
            required: false,
        }),
        title: Property.ShortText({
            displayName: 'Design Title',
            description: 'Optional. The title of the design (Maximum length: 255 characters).',
            required: false,
        }),
    },
    async run(context) {
        const props = context.propsValue;

        const designType: Record<string, unknown> = {
            type: props.designType,
        };

        if (props.designType === 'preset' && props.presetName) {
            designType['name'] = props.presetName;
        }

        if (props.designType === 'custom') {
            if (props.width) {
                designType['width'] = props.width;
            }
            if (props.height) {
                designType['height'] = props.height;
            }
        }

        const body: Record<string, unknown> = {
            design_type: designType,
        };

        if (props.assetId) {
            body['asset_id'] = props.assetId;
        }

        if (props.title) {
            body['title'] = props.title;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${BASE_URL}/rest/v1/designs`,
            body,
            headers: {
                'Content-Type': 'application/json',
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
        });

        return response.body;
    },
});
