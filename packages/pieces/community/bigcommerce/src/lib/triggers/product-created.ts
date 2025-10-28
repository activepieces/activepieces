
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { BigCommerceClient } from "../common/client";

interface WebhookPayload {
    scope: string; 
    store_id: string;
    data: {
        type: string; 
        id: number;
    };
    hash: string;
    created_at: number; 
    producer: string;
}

const sampleData = {
    "id": 112,
    "name": "Example Product",
    "type": "physical",
    "sku": "SKU112",
    "description": "Product description here.",
    "weight": 1.0,
    "price": 29.99,
    "cost_price": 15.00,
    "retail_price": 34.99,
    "sale_price": 25.00,
    "map_price": 0,
    "tax_class_id": 0,
    "product_tax_code": "",
    "categories": [3],
    "brand_id": 10,
    "inventory_level": 100,
    "inventory_warning_level": 10,
    "inventory_tracking": "product",
    "fixed_cost_shipping_price": 0,
    "is_free_shipping": false,
    "is_visible": true,
    "is_featured": false,
    "related_products": [-1],
    "warranty": "",
    "bin_picking_number": "BP123",
    "layout_file": "product.html",
    "upc": "123456789012",
    "search_keywords": "example, test",
    "availability": "available",
    "availability_description": "",
    "gift_wrapping_options_type": "any",
    "gift_wrapping_options_list": [],
    "sort_order": 0,
    "condition": "New",
    "is_condition_shown": false,
    "order_quantity_minimum": 0,
    "order_quantity_maximum": 0,
    "page_title": "Example Product Page Title",
    "meta_keywords": ["example", "product"],
    "meta_description": "Meta description for example product.",
    "date_created": "2025-10-28T10:30:00Z",
    "date_modified": "2025-10-28T10:30:00Z",
    "view_count": 0,
    "preorder_release_date": null,
    "preorder_message": "",
    "is_preorder_only": false,
    "is_price_hidden": false,
    "price_hidden_label": "",
    "custom_url": {
        "url": "/example-product/",
        "is_customized": false
    },
    "open_graph_type": "product",
    "open_graph_title": "",
    "open_graph_description": "",
    "open_graph_use_meta_description": true,
    "open_graph_use_product_name": true,
    "open_graph_use_image": true,
    "gtin": "",
    "mpn": ""
};


export const productCreated = createTrigger({
    auth: bigcommerceAuth,
    name: 'product_created',
    displayName: 'Product Created',
    description: 'Triggers when a new product is created. (Requires manual webhook setup in BigCommerce: `store/product/created`).',
    props: {},
    sampleData: sampleData,
    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        return;
    },

    async onDisable(context) {
        return;
    },

    async run(context) {
        const payload = context.payload as unknown as WebhookPayload;

        if (payload.scope !== 'store/product/created' || payload.data?.type !== 'product') {
            console.log(`Webhook received for scope ${payload.scope} / type ${payload.data?.type}, ignoring.`);
            return [];
        }

        const productId = payload.data?.id;
        if (!productId) {
            console.error("Webhook payload missing product ID:", payload);
            return [];
        }

        try {
            const client = new BigCommerceClient(context.auth as BigCommerceAuth);
            const product = await client.getProductById(productId);
            return [product];
        } catch (error) {
            console.error(`Error fetching BigCommerce product ${productId}`, error);
            return [];
        }
    },

    async test(context) {
        return [sampleData];
    }
});