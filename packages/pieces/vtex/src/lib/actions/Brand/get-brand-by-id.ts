import { createAction, Property } from "@activepieces/pieces-framework";
import { Brand } from "../../common/Brand";
import { auth } from "../../common/auth";

export const getBrandById = createAction({
    name: "get-brand-by-id",
    displayName: "Get Brand By ID",
    description: "Find a Brand in your catalog by it's id",
    props: {
        authentication: auth,
        BrandId: Property.Number({
            displayName: "Brand ID",
            description: "The Brand ID",
            required: true,
        })
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue.authentication;
        const { BrandId } = context.propsValue;

        const brand = new Brand(hostUrl, appKey, appToken);

        return await brand.getBrandById(BrandId);

    },
});