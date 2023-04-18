import { createAction, Property } from "@activepieces/pieces-framework";
import { Product } from "../../common/Product";
import { Replace } from "../../common/types";
import { auth } from "../../common/auth";

export const createProduct = createAction({
    name: "create-product",
    displayName: "Create New Product",
    description: "Create a new product to your catalog",
    props: {
        authentication: auth,
        Name: Property.ShortText({
            displayName: "Name",
            required: true,
        }),
        Title: Property.ShortText({
            displayName: "Title",
            required: true,
        }),
        Description: Property.ShortText({
            displayName: "Description",
            required: true,
        }),
        BrandId: Property.Number({
            displayName: "Brand ID",
            required: true,
        }),
        CategoryId: Property.Number({
            displayName: "Category ID",
            required: true,
        }),
        LinkId: Property.ShortText({
            displayName: "Link ID",
            required: false,
        }),
        RefId: Property.ShortText({
            displayName: "Ref ID",
            required: false,
        }),
        Id: Property.Number({
            displayName: "Product ID",
            description: "Set the product ID",
            required: false,
        }),
        IsVisible: Property.Checkbox({
            displayName: "Is Visible",
            required: false,
        }),
        DescriptionShort: Property.ShortText({
            displayName: "Short Description",
            required: false,
        }),
        ReleaseDate: Property.ShortText({
            displayName: "Release Date",
            required: false,
        }),
        KeyWords: Property.ShortText({
            displayName: "Key Words",
            description: "Similar words",
            required: false,
        }),
        IsActive: Property.Checkbox({
            displayName: "Is Active",
            required: false,
        }),
        TaxCode: Property.ShortText({
            displayName: "Tax Code",
            required: false,
        }),
        MetaTagDescription: Property.ShortText({
            displayName: "Metatag description",
            required: false,
        }),
        ShowWithoutStock: Property.Checkbox({
            displayName: "Show Without Stock",
            required: false,
        }),
        Score: Property.Number({
            displayName: "Score",
            required: false,
        }),
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue.authentication;
        const productData: Replace<typeof context.propsValue, { authentication?: typeof context.propsValue.authentication }> = { ...context.propsValue };
        delete productData.authentication;
        
        const product = new Product(hostUrl, appKey, appToken);

        return await product.createProduct(productData);
    },
});