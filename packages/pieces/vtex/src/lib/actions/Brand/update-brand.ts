import { createAction, Property } from "@activepieces/pieces-framework";
import { Brand } from "../../common/Brand";
import { Replace } from "../../common/types";

export const updateBrand = createAction({
    name: "update-brand",
    displayName: "Update Brand",
    description: "Update a Brand in your catalog",
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
        Id: Property.Number({
            displayName: "Brand ID",
            description: "Set the brand ID",
            required: true,
        }),
        Name: Property.ShortText({
            displayName: "Name",
            required: true,
        }),
        SiteTitle: Property.ShortText({
            displayName: "Site Title",
            required: true,
        }),
        LinkId: Property.ShortText({
            displayName: "Link ID",
            required: true,
        }),
        Text: Property.ShortText({
            displayName: "Text",
            required: true,
        }),
        MenuHome: Property.Checkbox({
            displayName: "Menu Home",
            required: true,
        }),
        Keywords: Property.ShortText({
            displayName: "Keywords",
            description: "Similar words",
            required: true,
        }),
        Active: Property.Checkbox({
            displayName: "Active",
            required: true,
        }),
        Score: Property.Number({
            displayName: "Score",
            required: true,
        }),
    },
    async run(context) {
        const { hostUrl, appKey, appToken, Id } = context.propsValue;
        const brandData: Replace<typeof context.propsValue, { hostUrl?: string; appKey?:string; appToken?: string}> = { ...context.propsValue };
        delete brandData.hostUrl;
        delete brandData.appKey;
        delete brandData.appToken;

        const brand = new Brand(hostUrl, appKey, appToken);

        return await brand.updateBrand(Id, brandData);

    },
});