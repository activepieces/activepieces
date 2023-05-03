import { createAction, Property } from "@activepieces/pieces-framework";
import { Sku } from "../../common/SKU";
import { auth } from "../../common/auth";

export const getSkuByProductId = createAction({
    name: "get-sku-by-product-id",
    displayName: "Get SKU By Product ID",
    description: "Find a Sku in your catalog by a Product id",
    props: {
        authentication: auth,
        productId: Property.Number({
            displayName: "Product ID",
            description: "The Product ID",
            required: true,
        })
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue.authentication;
        const { productId } = context.propsValue;

        const sku = new Sku(hostUrl, appKey, appToken);

        return await sku.getSkuListByProductId(productId);

    },
});