import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../../index';

export const airtopCreateSessionAction = createAction({
    auth: airtopAuth,
    name: 'airtop_create_session',
    displayName: 'Create Session',
    description: 'Starts a new browser session in Airtop. Returns session details and metadata.',
    props: {
        baseProfileId: Property.ShortText({
            displayName: 'Base Profile ID',
            required: false,
            description: 'Optional: ID of the base profile for the session.',
        }),
        persistProfile: Property.Checkbox({
            displayName: 'Persist Profile',
            required: false,
            description: 'Optional: Whether to persist the browser profile across sessions.',
            defaultValue: undefined,
        }),
        timeoutMinutes: Property.Number({
            displayName: 'Timeout Minutes',
            required: false,
            description: 'Optional: How many minutes before the session times out.',
            defaultValue: undefined,
        }),
    },
    async run({ auth, propsValue }) {
        const configuration: Record<string, unknown> = {};
        if (propsValue['baseProfileId']) configuration['baseProfileId'] = propsValue['baseProfileId'];
        if (propsValue['persistProfile'] !== undefined) configuration['persistProfile'] = propsValue['persistProfile'];
        if (propsValue['timeoutMinutes'] !== undefined) configuration['timeoutMinutes'] = propsValue['timeoutMinutes'];

        const body = Object.keys(configuration).length > 0 ? { configuration } : {};

        const response = await airtopApiCall<any>({
            apiKey: auth as string,
            method: HttpMethod.POST,
            resourceUri: '/sessions',
            body,
        });

        return {
            session: response?.data || null,
            meta: response?.meta || null,
            errors: response?.errors || null,
            warnings: response?.warnings || null,
            raw: response,
        };
    }

});
