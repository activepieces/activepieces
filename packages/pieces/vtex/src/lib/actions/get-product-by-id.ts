import { createAction, Property } from "@activepieces/pieces-framework";
import http from "https";

export const getProductById = createAction({
    name: "get-product-by-id",
    displayName: "Get Product By ID",
    description: "Find a product in your catalog by it's id",
    props: {
        hostUrl: Property.ShortText({
            displayName: "Host Url",
            description:"{accountName}.{environment}.com",
            required: true,
        }),
        productId: Property.Number({
            displayName: "Product ID",
            description: "The product ID",
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
        const { hostUrl, productId, appKey, appToken } = context.propsValue;

        const options = {
            "method": "GET",
            "hostname": hostUrl,
            "path": "/api/catalog/pvt/product/" + productId,
            "headers": {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "X-VTEX-API-AppKey": appKey,
              "X-VTEX-API-AppToken": appToken
            }
          };

        return new Promise((resolve, reject) => {
            http.request(options, function (res) {
                const chunks : Buffer[] = [];

                res.on("data", function (chunk) {
                    chunks.push(chunk);
                });

                res.on("end", function () {
                    if (res.statusCode !== 200) reject("Product Not Found");
                    const body = Buffer.concat(chunks);
                    resolve(body.toString());
                });

            }).on("error", (err) => {
                reject(err)
            }).end()
        })

    },
});