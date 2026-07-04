import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, HttpResponse } from '@activepieces/pieces-common';
import { productboardCommon } from './client';
import { productboardAuth } from './auth';

/**
 * Reusable properties for Productboard pieces.
 */
export const productboardProps = {
    /**
     * Property for selecting a feature from Productboard.
     * @param required Whether the property is mandatory.
     */
    feature_id: (required = true) => Property.Dropdown({
        displayName: 'Feature',
        description: 'The feature to select.',
        required,
        auth:productboardAuth,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };
            }
            
            const response: HttpResponse<{ data: { id: string; name: string }[] }> = await productboardCommon.apiCall({
                auth,
                method: HttpMethod.GET,
                resourceUri: '/features'
            });
            const features = response.body.data ?? [];
            return {
                disabled: false,
                options: features.map((feature) => ({
                    label: feature.name,
                    value: feature.id
                }))
            };
        }
    }),
    /**
     * Property for selecting a feature status from Productboard.
     * @param required Whether the property is mandatory.
     */
    status_id: (required = true) => Property.Dropdown({
        displayName: 'Status',
        description: 'Current status of the feature',
        required,
        auth:productboardAuth,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };
            }
            const response: HttpResponse<{ data: { id: string; name: string }[] }> = await productboardCommon.apiCall({
                auth: auth,
                method: HttpMethod.GET,
                resourceUri: '/feature-statuses'
            });
            const statuses = response.body.data ?? [];
            return {
                disabled: false,
                options: statuses.map((status) => ({
                    label: status.name,
                    value: status.id
                }))
            };
        }
    })
};
