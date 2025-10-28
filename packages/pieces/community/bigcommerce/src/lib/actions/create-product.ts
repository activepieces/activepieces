import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const getProductFields = (productType: string): DynamicPropsValue => {
    return {
        name: Property.ShortText({
            displayName: 'Product Name',
            description: 'A unique product name (required, max 250 characters)',
            required: true,
        }),
        type: Property.StaticDropdown({
            displayName: 'Product Type',
            description: 'The product type (required)',
            required: true,
            defaultValue: productType || 'physical',
            options: {
                disabled: false,
                options: [
                    { label: 'Physical', value: 'physical' },
                    { label: 'Digital', value: 'digital' },
                ],
            },
        }),
        weight: Property.Number({
            displayName: 'Weight',
            description: 'Weight of the product (required, used for shipping calculations)',
            required: true,
            defaultValue: 0,
        }),
        price: Property.Number({
            displayName: 'Price',
            description: 'The price of the product (required, minimum 0)',
            required: true,
        }),
        categories: Property.MultiSelectDropdown({
            displayName: 'Categories',
            description: 'Product categories (optional, but recommended for better organization)',
            required: false,
            refreshers: ['auth'],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first',
                    };
                }

                try {
                    const response = await sendBigCommerceRequest({
                        auth: auth as any,
                        url: '/catalog/categories',
                        method: HttpMethod.GET,
                        queryParams: { limit: '250' },
                    });

                    const categories = (response.body as { data: any[] }).data || [];

                    if (categories.length === 0) {
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'No categories found - create categories in BigCommerce first',
                        };
                    }

                    return {
                        disabled: false,
                        options: categories.map((category: any) => ({
                            label: category.name,
                            value: category.id,
                        })),
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error fetching categories',
                    };
                }
            },
        }),
        sku: Property.ShortText({
            displayName: 'SKU',
            description: 'Product SKU (optional, max 255 characters)',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Product description (can include HTML)',
            required: false,
        }),
        is_visible: Property.Checkbox({
            displayName: 'Is Visible',
            description: 'Whether product should be displayed to customers',
            required: false,
            defaultValue: true,
        }),
        is_featured: Property.Checkbox({
            displayName: 'Is Featured',
            description: 'Whether product should be included in featured products',
            required: false,
            defaultValue: false,
        }),
        availability: Property.StaticDropdown({
            displayName: 'Availability',
            description: 'Product availability status',
            required: false,
            defaultValue: 'available',
            options: {
                disabled: false,
                options: [
                    { label: 'Available', value: 'available' },
                    { label: 'Disabled', value: 'disabled' },
                    { label: 'Preorder', value: 'preorder' },
                ],
            },
        }),
        condition: Property.StaticDropdown({
            displayName: 'Condition',
            description: 'Product condition',
            required: false,
            defaultValue: 'New',
            options: {
                disabled: false,
                options: [
                    { label: 'New', value: 'New' },
                    { label: 'Used', value: 'Used' },
                    { label: 'Refurbished', value: 'Refurbished' },
                ],
            },
        }),
        inventory_tracking: Property.StaticDropdown({
            displayName: 'Inventory Tracking',
            description: 'Type of inventory tracking',
            required: false,
            defaultValue: 'none',
            options: {
                disabled: false,
                options: [
                    { label: 'None', value: 'none' },
                    { label: 'Product', value: 'product' },
                    { label: 'Variant', value: 'variant' },
                ],
            },
        }),
        inventory_level: Property.Number({
            displayName: 'Inventory Level',
            description: 'Current inventory level (only if inventory tracking is enabled)',
            required: false,
        }),
        width: Property.Number({
            displayName: 'Width',
            description: 'Product width (used for shipping calculations)',
            required: false,
        }),
        height: Property.Number({
            displayName: 'Height',
            description: 'Product height (used for shipping calculations)',
            required: false,
        }),
        depth: Property.Number({
            displayName: 'Depth',
            description: 'Product depth (used for shipping calculations)',
            required: false,
        }),
        is_free_shipping: Property.Checkbox({
            displayName: 'Free Shipping',
            description: 'Whether product has free shipping',
            required: false,
            defaultValue: false,
        }),
        brand_id: Property.Dropdown({
            displayName: 'Brand',
            description: 'Product brand (optional)',
            required: false,
            refreshers: ['auth'],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first',
                    };
                }

                try {
                    const response = await sendBigCommerceRequest({
                        auth: auth as any,
                        url: '/catalog/brands',
                        method: HttpMethod.GET,
                        queryParams: { limit: '250' },
                    });

                    const brands = (response.body as { data: any[] }).data || [];

                    if (brands.length === 0) {
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'No brands found',
                        };
                    }

                    return {
                        disabled: false,
                        options: brands.map((brand: any) => ({
                            label: brand.name,
                            value: brand.id,
                        })),
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error fetching brands',
                    };
                }
            },
        }),
        upc: Property.ShortText({
            displayName: 'UPC',
            description: 'Universal Product Code (max 14 characters)',
            required: false,
        }),
        mpn: Property.ShortText({
            displayName: 'MPN',
            description: 'Manufacturer Part Number',
            required: false,
        }),
        gtin: Property.ShortText({
            displayName: 'GTIN',
            description: 'Global Trade Item Number (max 14 characters)',
            required: false,
        }),
        search_keywords: Property.ShortText({
            displayName: 'Search Keywords',
            description: 'Comma-separated keywords for search',
            required: false,
        }),
    };
};

export const createProduct = createAction({
    auth: bigcommerceAuth,
    name: 'create_product',
    displayName: 'Create Product',
    description: 'Creates a new product in BigCommerce following the official API requirements',
    props: {
        productFields: Property.DynamicProperties({
            displayName: 'Product Information',
            description: 'Product fields (name, type, weight, and price are required; categories are optional)',
            required: true,
            refreshers: [],
            props: async () => {
                return getProductFields('physical');
            },
        }),
    },
    async run(context) {
        const { productFields } = context.propsValue;

        if (!productFields || typeof productFields !== 'object') {
            throw new Error('Product fields are required');
        }

        const { name, type, weight, price, categories } = productFields as any;

        // Validate required fields according to BigCommerce API
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('Product name is required and cannot be empty');
        }

        if (name.length > 250) {
            throw new Error('Product name cannot exceed 250 characters');
        }

        if (!type || (type !== 'physical' && type !== 'digital')) {
            throw new Error('Product type is required and must be either "physical" or "digital"');
        }

        if (weight === undefined || weight === null || weight < 0) {
            throw new Error('Weight is required and must be 0 or greater');
        }

        if (price === undefined || price === null || price < 0) {
            throw new Error('Price is required and must be 0 or greater');
        }

        // Validate categories (optional)
        let categoryArray: number[] = [];

        if (categories) {
            if (Array.isArray(categories)) {
                categoryArray = categories.map((id: any) => {
                    const numId = typeof id === 'string' ? parseInt(id) : id;
                    if (isNaN(numId)) {
                        throw new Error(`Invalid category ID: ${id}`);
                    }
                    return numId;
                });
            } else if (typeof categories === 'number' || typeof categories === 'string') {
                const numId = typeof categories === 'string' ? parseInt(categories) : categories;
                if (isNaN(numId)) {
                    throw new Error(`Invalid category ID: ${categories}`);
                }
                categoryArray = [numId];
            }
        }

        try {
            // Build product data according to BigCommerce API spec
            const productData: any = {
                name: name.trim(),
                type,
                weight: Number(weight),
                price: Number(price),
            };

            // Add categories only if provided
            if (categoryArray.length > 0) {
                productData.categories = categoryArray;
            }

            // Add optional fields if provided
            const optionalFields = [
                'sku', 'description', 'is_visible', 'is_featured', 'availability',
                'condition', 'inventory_tracking', 'inventory_level', 'width',
                'height', 'depth', 'is_free_shipping', 'brand_id', 'upc', 'mpn', 
                'gtin', 'search_keywords'
            ];

            optionalFields.forEach(field => {
                const value = (productFields as any)[field];
                if (value !== undefined && value !== null && value !== '') {
                    productData[field] = value;
                }
            });

            console.log('Creating product with data:', JSON.stringify(productData, null, 2));

            const response = await sendBigCommerceRequest({
                auth: context.auth,
                url: '/catalog/products',
                method: HttpMethod.POST,
                body: productData,
            });

            const product = (response.body as { data: any }).data;

            return {
                success: true,
                message: `Product "${name}" created successfully`,
                data: product,
            };
        } catch (error) {
            console.error('Product creation error:', error);
            throw handleBigCommerceError(error, 'Failed to create product');
        }
    },
});