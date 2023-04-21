import { Property } from "@activepieces/pieces-framework";

const markdownDescription = `
**Host Url**: The VTEX store host (e.g \`{{accountName}}.{{environment}}.com\`)
**App Key** and **App Token**: To get your app key and app token, follow the steps below:
1. Go to your vtex account on **Account Settings** -> **Account** -> **Security**
2. Click on **Generate access key and secret**
4. Copy the access key as your **App Key** and the secret is your **App Token**.
`;

export const auth = Property.CustomAuth({
    displayName: "Authentication",
    description: markdownDescription,
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
        })
    },
    required: true
})