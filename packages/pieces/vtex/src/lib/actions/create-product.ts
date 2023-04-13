import { createAction, Property } from "@activepieces/pieces-framework";
import http from "https";

export const createProduct = createAction({
    name: "create-product",
    displayName: "Create New Product",
    description: "Create a new product to your catalog",
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
        Title: Property.Number({
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
        BrandName: Property.ShortText({
            displayName: "Brand Name",
            required: false,
        }),
        Id: Property.ShortText({
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
        const { hostUrl, appKey, appToken } = context.propsValue;
        const {
            Id,
            Name,
            CategoryId,
            BrandName,
            BrandId,
            LinkId,
            RefId,
            IsVisible,
            Description,
            DescriptionShort,
            ReleaseDate,
            KeyWords,
            Title,
            IsActive,
            TaxCode,
            MetaTagDescription,
            ShowWithoutStock,
            Score
        } = context.propsValue;

        const options = {
            "method": "POST",
            "hostname": hostUrl,
            "path": "/api/catalog/pvt/product/",
            "headers": {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-VTEX-API-AppKey": appKey,
                "X-VTEX-API-AppToken": appToken
            }
        };

        return new Promise((resolve, reject) => {
            const request = http.request(options, function (res) {
                const chunks: Buffer[] = [];

                res.on("data", function (chunk) {
                    chunks.push(chunk);
                });

                res.on("end", function () {
                    const body = Buffer.concat(chunks).toString();

                    if (res.statusCode !== 200 && res.statusCode !== 201) reject({
                        statusCode: res.statusCode,
                        error: body ? body : "Something went wrong",
                    });

                    resolve(body);
                });

            })

            request.write(JSON.stringify({
                Id,
                Name,
                CategoryId,
                BrandName,
                BrandId,
                LinkId,
                RefId,
                IsVisible,
                Description,
                DescriptionShort,
                ReleaseDate,
                KeyWords,
                Title,
                IsActive,
                TaxCode,
                MetaTagDescription,
                ShowWithoutStock,
                Score

            }));

            request.on("error", (err) => reject(err))
            request.end();
        })

    },
});