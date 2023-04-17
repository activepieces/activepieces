import { createAction, Property } from "@activepieces/pieces-framework";
import { Brand } from "../../common/Brand";

export const deleteBrand = createAction({
    name: "delete-brand",
    displayName: "Delete Brand",
    description: "Delete a Brand in your catalog by it's id",
    props: {
        hostUrl: Property.ShortText({
            displayName: "Host Url",
            description: "{accountName}.{environment}.com",
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
        }),
        brandId: Property.Number({
            displayName: "Brand ID",
            description: "The Brand ID",
            required: true,
        })
    },
    async run(context) {
        const { hostUrl, brandId, appKey, appToken } = context.propsValue;
        
        const brand = new Brand(hostUrl, appKey, appToken);

        return await brand.deleteBrand(brandId);

    },
});