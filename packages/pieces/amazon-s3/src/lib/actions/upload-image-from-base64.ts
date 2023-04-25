import { createAction, Property } from "@activepieces/pieces-framework";
import { S3 } from "@aws-sdk/client-s3";
import { auth } from "../common/auth";

export const uploadBase64Image = createAction({
    name: 'upload-base64-image',
    displayName: "Upload base64 Image",
    description: "Upload an image to S3 by using it's base64 string",
    props: {
        authentication: auth,
        base64: Property.LongText({
            displayName: 'Base64',
            required: true,
        }),
        imageName: Property.ShortText({
            displayName: 'Image Name',
            required: false,
            description: "my-image-name (no extension)"
        }),
        acl: Property.ShortText({
            displayName: 'ACL',
            required: true,
            defaultValue: "public-read"
        }),
        type: Property.ShortText({
            displayName: 'Type',
            required: true,
            defaultValue: "image/png"
        }),
    },
    async run(context) {
        const { accessKeyId, secretAccessKey, region, bucket } = context.propsValue.authentication;
        const { base64, imageName, acl, type } = context.propsValue;

        const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');

        const s3 = new S3({
            credentials: {
                accessKeyId,
                secretAccessKey
            },
            region: region || "us-east-1"
        })

        const contentType = type || "image/png";
        const [_, ext] = contentType.split("/");
        const extension = "." + ext;

        let generatedName = new Date().toISOString() + Date.now() + extension;

        const finalFileName = imageName ? imageName + extension : generatedName;

        const uploadResponse = await s3.putObject({
            Bucket: bucket,
            Key: finalFileName,
            ACL: acl,
            ContentType: contentType,
            Body: buffer,
        })

        return {
            fileName: finalFileName,
            url: `https://${bucket}.s3.${region}.amazonaws.com/${finalFileName}`,
            etag: uploadResponse.ETag,
        };
    }
});
