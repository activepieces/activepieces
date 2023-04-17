import { createAction, Property } from "@activepieces/pieces-framework";
import { Brand } from "../../common/Brand";
import { Replace } from "../../common/types";

export const createBrand = createAction({
    name: "create-brand",
    displayName: "Create new Brand",
    description: "Create a new Brand to your catalog",
    sampleData: {
        "Id": 2000013,
        "Name": "Orma Carbono2",
        "Text": "Orma Carbon2",
        "Keywords": "orma",
        "SiteTitle": "Orma Carbon2",
        "Active": true,
        "MenuHome": true,
        "AdWordsRemarketingCode": "",
        "LomadeeCampaignCode": "",
        "Score": null,
        "LinkId": null
    }
    ,
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
        Name: Property.ShortText({
            displayName: "Name",
            required: true,
        }),
        SiteTitle: Property.ShortText({
            displayName: "Site Title",
            required: false,
        }),
        LinkId: Property.ShortText({
            displayName: "Link ID",
            required: false,
        }),
        Id: Property.Number({
            displayName: "Brand ID",
            description: "Set the brand ID",
            required: false,
        }),
        Text: Property.ShortText({
            displayName: "Text",
            required: false,
        }),
        MenuHome: Property.Checkbox({
            displayName: "Menu Home",
            required: false,
        }),
        Keywords: Property.ShortText({
            displayName: "Keywords",
            description: "Similar words",
            required: false,
        }),
        Active: Property.Checkbox({
            displayName: "Active",
            required: false,
        }),
        Score: Property.Number({
            displayName: "Score",
            required: false,
        }),
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue;
        const brandData: Replace<typeof context.propsValue, { hostUrl?: string; appKey?: string; appToken?: string }> = { ...context.propsValue };
        delete brandData.hostUrl;
        delete brandData.appKey;
        delete brandData.appToken;

        const brand = new Brand(hostUrl, appKey, appToken);

        return await brand.createBrand(brandData);

    },
});