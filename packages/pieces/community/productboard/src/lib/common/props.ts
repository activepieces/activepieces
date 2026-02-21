import { Property, StaticPropsValue } from '@activepieces/pieces-framework';
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
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };
            }
            const typedAuth = auth as StaticPropsValue<typeof productboardAuth>;
            const response: HttpResponse<{ data: { id: string; name: string }[] }> = await productboardCommon.apiCall({
                auth: typedAuth,
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
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };
            }
            const typedAuth = auth as StaticPropsValue<typeof productboardAuth>;
            const response: HttpResponse<{ data: { id: string; name: string }[] }> = await productboardCommon.apiCall({
                auth: typedAuth,
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
