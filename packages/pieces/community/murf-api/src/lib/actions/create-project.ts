import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { murfAuth } from '../../index';
import { murfCommon, MURF_API_URL } from '../common/props';

export const createProject = createAction({
    auth: murfAuth,
    name: 'create_project',
    displayName: 'Create Project',
    description: 'Creates a new project.',
    props: {
        name: Property.ShortText({
            displayName: 'Project Name',
            required: true,
        }),
        dubbingType: Property.StaticDropdown({
            displayName: 'Dubbing Type',
            required: true,
            options: {
                options: [
                    { label: 'Automated', value: 'AUTOMATED' },
                    { label: 'QA', value: 'QA' },
                ],
            },
            defaultValue: 'AUTOMATED',
        }),
        targetLocales: murfCommon.locales('Target Locales', true),
        sourceLocale: murfCommon.locale('Source Locale', false),
        description: Property.LongText({
            displayName: 'Description',
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        const { name, dubbingType, targetLocales, sourceLocale, description } = propsValue as {
            name: string;
            dubbingType: string;
            targetLocales: string[];
            sourceLocale?: string;
            description?: string;
        };

        
        const requestBody: Record<string, unknown> = {
            name,
            dubbing_type: dubbingType,
            target_locales: targetLocales,
        };
        if (sourceLocale) requestBody['source_locale'] = sourceLocale;
        if (description) requestBody['description'] = description;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${MURF_API_URL}/murfdub/projects/create`,
            headers: {
                'Content-Type': 'application/json',
                'api-key': auth as string,
            },
            body: requestBody,
        });

        return response.body;
    },
});