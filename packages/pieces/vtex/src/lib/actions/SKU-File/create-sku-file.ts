import { createAction, Property } from "@activepieces/pieces-framework";
import { auth } from "../../common/auth";
import { SkuFile } from "../../common/SKU-File";
import { Replace } from "../../common/types";

export const createSkuFile = createAction({
    name: "create-sku-file",
    displayName: "Create New Sku File",
    description: "Create a new SKU File to your catalog",
    props: {
        authentication: auth,
        SkuId: Property.Number({
            displayName: "Sku ID",
            description: "Set the Sku ID",
            required: true,
        }),
        Url: Property.ShortText({
            displayName: "Image Url",
            required: true,
        }),
        Name: Property.ShortText({
            displayName: "Image Name",
            required: true,
        }),
        IsMain: Property.Checkbox({
            displayName: "Is Main Image",
            required: true,
        }),
        Label: Property.ShortText({
            displayName: "Image Label",
            required: false,
        }),
        Text: Property.ShortText({
            displayName: "Image Name",
            description:"General text of the image",
            required: false,
        })
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue.authentication;
        const skuFileData: Replace<typeof context.propsValue, { authentication?: typeof context.propsValue.authentication; SkuId?: number }> = { ...context.propsValue };
        delete skuFileData.authentication;
        delete skuFileData.SkuId;

        const skuFile = new SkuFile(hostUrl, appKey, appToken);

        return await skuFile.createSkuFile(context.propsValue.SkuId, skuFileData);

    },
});
