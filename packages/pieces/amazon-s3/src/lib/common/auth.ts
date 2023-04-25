import { Property } from "@activepieces/pieces-framework";

export const auth = Property.CustomAuth({
    displayName: "Authentication",
    props: {
        accessKeyId: Property.ShortText({
            displayName: 'Access Key ID',
            required: true,
        }),
        secretAccessKey: Property.SecretText({
            displayName: 'Secret Access Key',
            required: true,
        }),
        region: Property.ShortText({
            displayName: 'Region',
            defaultValue: "us-east-1",
            required: true,
        }),
        bucket: Property.ShortText({
            displayName: 'Bucket',
            required: true,
        })
    },
    required: true
})