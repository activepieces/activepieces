import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { customFieldsProp, ownerIdProp, visibleToProp } from '../common/props';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField, GetProductResponse } from '../common/types'; // ✅ Changed to GetProductResponse
import { HttpMethod } from '@activepieces/pieces-common';

export const createProductAction = createAction({
    auth: pipedriveAuth,
    name: 'create-product',
    displayName: 'Create Product',
    description: 'Creates a new product using Pipedrive API v2.',
    props: {
        name: Property.ShortText({
            displayName: 'Name',
            required: true,
        }),
        code: Property.ShortText({
            displayName: 'Code',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            required: false,
        }),
        unit: Property.ShortText({
            displayName: 'Unit',
            required: false,
        }),
        tax: Property.Number({
            displayName: 'Tax percentage',
            required: false,
        }),
        isActive: Property.Checkbox({
            displayName: 'Is Active ?', // This maps to `is_deleted` (negated) in v2
            required: false,
            defaultValue: true,
        }),
        ownerId: ownerIdProp('Owner', false), // Assumed to return numeric ID
        currency: Property.ShortText({
            displayName: 'Currency',
            required: false,
            description: 'Please enter currency code (e.g., "USD", "EUR").',
        }),
        price: Property.Number({
            displayName: 'Price',
            required: false,
        }),
        cost: Property.Number({
            displayName: 'Cost', // Maps to 'cost' in v2 prices object
            required: false,
        }),
        overheadCost: Property.Number({
            displayName: 'Overhead Cost', // Maps to 'direct_cost' in v2 prices object
            required: false,
        }),
        visibleTo: visibleToProp, // Assumed to return integer
        customfields: customFieldsProp('product'), // ✅ Added dynamic custom fields for products
    },
    async run(context) {
        const {
            name,
            code,
            description,
            unit,
            tax,
            isActive,
            ownerId,
            currency,
            price,
            cost,
            overheadCost,
            visibleTo,
        } = context.propsValue;

        // Define standard properties that are NOT custom fields for products
        const standardPropKeys = new Set([
            'name',
            'code',
            'description',
            'unit',
            'tax',
            'isActive',
            'ownerId',
            'currency',
            'price',
            'cost',
            'overheadCost',
            'visibleTo',
        ]);

        // Collect custom fields by filtering out standard properties from context.propsValue
        const customFields: Record<string, unknown> = {};
        // ✅ Cast context.propsValue to a more general type to allow string indexing
        const allProps = context.propsValue as Record<string, any>;
        for (const key in allProps) {
            if (Object.prototype.hasOwnProperty.call(allProps, key) && !standardPropKeys.has(key)) {
                customFields[key] = allProps[key];
            }
        }

        const productPayload: Record<string, any> = {
            name,
            code,
            description,
            unit,
            tax,
            is_deleted: !isActive, // If isActive is true, is_deleted should be false. If isActive is false, is_deleted should be true.
            prices: [
                {
                    price: price ?? 0,
                    currency: currency ?? 'USD',
                    cost: cost ?? 0,
                    direct_cost: overheadCost ?? 0, // 'overhead_cost' is renamed to 'direct_cost' in v2
                },
            ],
            visible_to: visibleTo,
        };

        if (ownerId) {
            productPayload.owner_id = ownerId;
        }

        // Assign the collected custom fields to the 'custom_fields' object in the payload
        if (Object.keys(customFields).length > 0) {
            productPayload.custom_fields = customFields;
        }

        // ✅ Use v2 endpoint for creating a product and expect GetProductResponse
        const createdProductResponse = await pipedriveApiCall<GetProductResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/products',
            body: productPayload,
        });

        // ✅ Fetch custom field definitions from v2
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/productFields',
        });

        // This function transforms the custom fields in the *response* data
        const updatedProductProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            createdProductResponse.data,
        );

        return {
            ...createdProductResponse,
            data: updatedProductProperties,
        };
    },
});
