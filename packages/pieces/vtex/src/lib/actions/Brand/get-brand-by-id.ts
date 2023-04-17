import { createAction, Property } from "@activepieces/pieces-framework";
import { Brand } from "../../common/Brand";

export const getBrandById = createAction({
    name: "get-brand-by-id",
    displayName: "Get Brand By ID",
    description: "Find a Brand in your catalog by it's id",
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
        BrandId: Property.Number({
            displayName: "Brand ID",
            description: "The Brand ID",
            required: true,
        })
    },
    async run(context) {
        const { hostUrl, BrandId, appKey, appToken } = context.propsValue;
        
        const brand = new Brand(hostUrl, appKey, appToken);

        return await brand.getBrandById(BrandId);

    },
});