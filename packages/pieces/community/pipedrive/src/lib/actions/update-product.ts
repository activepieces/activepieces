import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { customFieldsProp, ownerIdProp, visibleToProp } from '../common/props';
import {
    pipedriveApiCall,
    pipedrivePaginatedV1ApiCall,
    pipedriveParseCustomFields,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField, GetProductResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
import { isEmpty } from '@activepieces/shared';

export const updateProductAction = createAction({
    auth: pipedriveAuth,
    name: 'update-product',
    displayName: 'Update Product',
    description: 'Updates an existing product.',
    props: {
        id: Property.ShortText({
            displayName: 'Product ID',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            required: false,
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
        visibleTo: visibleToProp,
        customfields: customFieldsProp('product'),
    },
    async run(context) {
        const {
            id,
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

        const customFields = context.propsValue.customfields ?? {};

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

        const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v1/productFields',
        });

        const productCustomFields = pipedriveParseCustomFields(customFieldsResponse, customFields);

        if (!isEmpty(productCustomFields)) {
            productPayload.custom_fields = productCustomFields;
        }

        const updatedProductResponse = await pipedriveApiCall<GetProductResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.PATCH,
            resourceUri: '/v2/products/' + id,
            body: productPayload,
        });

        const updatedProductProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            updatedProductResponse.data,
        );

        return {
            ...updatedProductResponse,
            data: updatedProductProperties,
        };
    },
});
