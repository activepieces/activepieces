import { createAction, Property } from "@activepieces/pieces-framework";
import { Product } from "../../common/Product";

export const getProductById = createAction({
    name: "get-product-by-id",
    displayName: "Get Product By ID",
    description: "Find a product in your catalog by it's id",
    props: {
        hostUrl: Property.ShortText({
            displayName: "Host Url",
            description: "{accountName}.{environment}.com",
            required: true,
        }),
        productId: Property.Number({
            displayName: "Product ID",
            description: "The product ID",
            required: true,
        }),
        appKey: Property.SecretText({
            displayName: "App Key",
            description: "VTEX App Key",
            required: true,
        }),
        appToken: Property.SecretText({
            displayName: "App Token",
            description: "VTEX App Token",
            required: true,
        })
    },
    async run(context) {
        const { hostUrl, productId, appKey, appToken } = context.propsValue;
        
        const product = new Product(hostUrl, appKey, appToken);

        return await product.getProductById(productId);

    },
});