import { createAction, Property } from "@activepieces/pieces-framework";
import { Brand } from "../../common/Brand";
import { Replace } from "../../common/types";
import { auth } from "../../common/auth";

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
        authentication: auth,
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
        const { hostUrl, appKey, appToken } = context.propsValue.authentication;
        const brandData: Replace<typeof context.propsValue, { authentication?: typeof context.propsValue.authentication }> = { ...context.propsValue };
        delete brandData.authentication;
       
        const brand = new Brand(hostUrl, appKey, appToken);

        return await brand.createBrand(brandData);

    },
});