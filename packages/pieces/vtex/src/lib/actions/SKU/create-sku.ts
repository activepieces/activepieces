import { createAction, Property } from "@activepieces/pieces-framework";
import { Sku } from "../../common/SKU";
import { Replace } from "../../common/types";
import { auth } from "../../common/auth";

export const createSku = createAction({
    name: "create-sku",
    displayName: "Create New Sku",
    description: "Create a new SKU to your catalog",
    props: {
        authentication: auth,
        ProductId: Property.Number({
            displayName: "Product ID",
            description: "ID of the product to be associated with this SKU",
            required: true,
        }),
        Name: Property.ShortText({
            displayName: "SKU Name",
            description: "Name the variation of the product",
            required: true,
        }),
        PackagedHeight: Property.Number({
            displayName: "Package Height",
            required: true
        }),
        PackagedLength: Property.Number({
            displayName: "Package Length",
            required: true
        }),
        PackagedWidth: Property.Number({
            displayName: "Package Width",
            required: true
        }),
        PackagedWeightKg: Property.Number({
            displayName: "Package Weight (Kg)",
            required: true
        }),
        IsActive: Property.Checkbox({
            displayName: "Is Active",
            required: false,
        }),
        IsKit: Property.Checkbox({
            displayName: "Is Kit",
            required: false,
        }),
        Id: Property.Number({
            displayName: "Sku ID",
            description: "Set the Sku ID",
            required: false,
        })
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue.authentication;
        const skuData: Replace<typeof context.propsValue, { authentication?: typeof context.propsValue.authentication }> = { ...context.propsValue };
        delete skuData.authentication;

        const sku = new Sku(hostUrl, appKey, appToken);

        return await sku.createSku(skuData);

    },
});
