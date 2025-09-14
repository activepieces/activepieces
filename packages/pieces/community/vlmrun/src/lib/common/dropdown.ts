import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';


export const FileIDDropdown = Property.Dropdown({
    displayName: 'File',
    description: 'Select a file from your uploaded files',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
            };
        }

        try {
            const response = await makeRequest(auth as string, HttpMethod.GET, `/files`);
            const files = response.data || [];

            return {
                disabled: false,
                options: files.map((file: any) => ({
                    label: `${file.filename} (${file.purpose})`,
                    value: file.id,
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
            };
        }
    },
});

