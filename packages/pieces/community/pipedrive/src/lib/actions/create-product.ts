import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { customFieldsProp, ownerIdProp, visibleToProp } from '../common/props';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField, GetProductResponse } from '../common/types';
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
            displayName: 'Is Active ?', 
            required: false,
            defaultValue: true,
        }),
        ownerId: ownerIdProp('Owner', false),
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
            displayName: 'Cost', 
            required: false,
        }),
        overheadCost: Property.Number({
            displayName: 'Overhead Cost', 
            required: false,
        }),
        visibleTo: visibleToProp, // Assumed to return integer
        customfields: customFieldsProp('product'), 
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
            is_deleted: !isActive, 
            prices: [
                {
                    price: price ?? 0,
                    currency: currency ?? 'USD',
                    cost: cost ?? 0,
                    direct_cost: overheadCost ?? 0, 
                },
            ],
            visible_to: visibleTo,
        };

        if (ownerId) {
            productPayload.owner_id = ownerId;
        }

        
        if (Object.keys(customFields).length > 0) {
            productPayload.custom_fields = customFields;
        }

        
        const createdProductResponse = await pipedriveApiCall<GetProductResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: '/v2/products',
            body: productPayload,
        });

        
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v1/productFields',
        });

        
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
