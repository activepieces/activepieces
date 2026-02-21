import { Property, PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { productboardCommon } from './client';

export const productboardProps = {
    feature_id: (required = true) => Property.Dropdown({
        displayName: 'Feature',
        description: 'The feature to select.',
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };
            }
            const response = await productboardCommon.apiCall({
                auth: auth as any,
                method: HttpMethod.GET,
                resourceUri: '/features'
            });
            const features = response.body['data'] ?? [];
            return {
                disabled: false,
                options: features.map((feature: { id: string; name: string }) => ({
                    label: feature.name,
                    value: feature.id
                }))
            };
        }
    }),
    status_id: (required = true) => Property.Dropdown({
        displayName: 'Status',
        description: 'Current status of the feature',
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };
            }
            const response = await productboardCommon.apiCall({
                auth: auth as any,
                method: HttpMethod.GET,
                resourceUri: '/feature-statuses'
            });
            const statuses = response.body['data'] ?? [];
            return {
                disabled: false,
                options: statuses.map((status: { id: string; name: string }) => ({
                    label: status.name,
                    value: status.id
                }))
            };
        }
    })
};
