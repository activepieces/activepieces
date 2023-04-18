import { createAction, Property } from "@activepieces/pieces-framework";
import { Brand } from "../../common/Brand";
import { auth } from "../../common/auth";

export const getBrandList = createAction({
    name: "get-brand-list",
    displayName: "Get Brand List",
    description: "Find all Brands in your catalog",
    props: {
        authentication: auth,
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue.authentication;
        
        const brand = new Brand(hostUrl, appKey, appToken);

        return await brand.getBrandList();

    },
});