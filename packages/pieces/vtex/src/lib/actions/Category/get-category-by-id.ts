import { createAction, Property } from "@activepieces/pieces-framework";
import { Category } from "../../common/Category";
import { auth } from "../../common/auth";

export const getCategoryById = createAction({
    name: "get-category-by-id",
    displayName: "Get Category",
    description: "Find a Category in your catalog by it's id",
    props: {
        authentication: auth,
        categoryId: Property.Number({
            displayName: "Category ID",
            description: "The Category ID",
            required: false,
        })
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue.authentication;
        const { categoryId } = context.propsValue;

        const category = new Category(hostUrl, appKey, appToken);

        return await category.getCategory(categoryId);

    },
});