import { Property, createAction } from "@activepieces/pieces-framework";
import { S3 } from "@aws-sdk/client-s3";
import { amazonS3Auth } from "../..";

export const readFile = createAction({
    auth: amazonS3Auth,
    name: 'read-file',
    displayName: "Read File",
    description: "Read a file from S3 to use it in other steps",
    props: {
        key: Property.ShortText({
            displayName: 'Key',
            description: 'The key of the file to read',
            required: true
        })
    },
    async run(context) {
        const { accessKeyId, secretAccessKey, region, bucket } = context.auth;
        const { key } = context.propsValue;
        const s3 = new S3({
            credentials: {
                accessKeyId,
                secretAccessKey
            },
            region: region || "us-east-1"
        })

        const file = (await s3.getObject({
            Bucket: bucket,
            Key: key
        }));
        const base64 = `data:${file.ContentType};base64,${await file.Body?.transformToString('base64')}`
        return base64;
    },
});
