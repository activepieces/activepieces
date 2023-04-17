import { createAction, Property } from "@activepieces/pieces-framework";
import { Brand } from "../common/Brand";

export const getBrandList = createAction({
    name: "get-brand-list",
    displayName: "Get Brand List",
    description: "Find all Brands in your catalog",
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
        })
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue;
        
        const brand = new Brand(hostUrl, appKey, appToken);

        return await brand.getBrandList();

    },
});