import { createAction, Property } from "@activepieces/pieces-framework";
import { Category } from "../../common/Category";

export const getCategoryById = createAction({
    name: "get-category-by-id",
    displayName: "Get Category",
    description: "Find a Category in your catalog by it's id",
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
        categoryId: Property.Number({
            displayName: "Category ID",
            description: "The Category ID",
            required: false,
        })
    },
    async run(context) {
        const { hostUrl, categoryId, appKey, appToken } = context.propsValue;
        
        const category = new Category(hostUrl, appKey, appToken);

        return await category.getCategory(categoryId);

    },
});