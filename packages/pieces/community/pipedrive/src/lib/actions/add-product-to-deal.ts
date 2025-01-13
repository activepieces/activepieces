import { pipedriveAuth } from "../../index";
import { createAction, PiecePropValueSchema, Property } from "@activepieces/pieces-framework";
import { fetchDealsOptions, fetchProductsOptions } from "../common/props";
import { pipedriveApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const addProdictToDealAction = createAction({
    auth:pipedriveAuth,
    name: 'add-product-to-deal',
    displayName: 'Add Product to Deal',
    description: 'Adds a product to a deal.',   
    props: {
         dealId: Property.Dropdown({
                displayName: 'Deal',
                refreshers: [],
                required: true,
                options: async ({ auth }) => {
                    if (!auth) {
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'Please connect your account.',
                        };
                    }
                    const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
                    const options = await fetchDealsOptions(authValue);
     
                    return {
                        disabled: false,
                        options,
                    };
                },
            }),
            productId: Property.Dropdown({
                displayName: 'Product',
                refreshers: [],
                required: true,
                options: async ({ auth }) => {
                    if (!auth) {
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'Please connect your account.',
                        };
                    }
                    const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
                    const options = await fetchProductsOptions(authValue);
     
                    return {
                        disabled: false,
                        options,
                    };
                },
            }),
            price:Property.Number({ 
                displayName: 'Price',
                required: true,
            }),
            quantity:Property.Number({
                displayName: 'Quantity',
                required: true,
            }),
            discount:Property.Number({
                displayName: 'Discount',
                required: false,
            }),
            discountType:Property.StaticDropdown({
                displayName: 'Discount Type',
                required: false,
                options: {
                    disabled: false,
                    options: [
                        {
                            label: 'Percentage',
                            value: 'percentage',
                        },
                        {
                            label: 'Amount',
                            value: 'amount',
                        },
                    ],
                },
            }),
            comments:Property.LongText({
                displayName: 'Comments',
                required: false,
            }),
            enableProduct:Property.Checkbox({
                displayName: 'Enable Product?',
                required: false,
                defaultValue:true
            }),
            taxMethod:Property.StaticDropdown({
                displayName: 'Tax Method',
                required: false,
                options: {
                    disabled: false,
                    options: [
                        {
                            label: 'Exclusive',
                            value: 'exclusive',
                        },
                        {
                            label: 'Inclusive',
                            value: 'inclusive',
                        },
                        {
                            label:'None',
                            value:'none' 
                        }
                    ],
                },
            }),
            taxPercentage: Property.Number({
                displayName: 'Tax Percentage',
                required: false,
            }),
    },
    async run(context) {
        const { productId,dealId,price,quantity,discountType,discount,comments,enableProduct,taxPercentage,taxMethod } = context.propsValue;

        const response = await pipedriveApiCall({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: `/deals/${dealId}/products`,
            body: {
                product_id: productId,
                item_price:price,
                quantity,
                discount_type: discountType,
                discount,
                comments,
                enable_product: enableProduct,
                tax: taxPercentage,
                tax_method: taxMethod,
            }
        });

        return response;

    }
})