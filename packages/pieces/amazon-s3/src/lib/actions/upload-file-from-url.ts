import { createAction, Property } from "@activepieces/pieces-framework";
import { auth } from "../common/auth";
import { S3 } from "@aws-sdk/client-s3";
import axios from "axios";

export const uploadFileFromUrl = createAction({
    name: 'upload-file-from-url',
    displayName: "Upload File from URL",
    description: "Upload an file to S3 by using it's url",
    props: {
        authentication: auth,
        url: Property.LongText({
            displayName: 'url',
            required: true,
        }),
        imageName: Property.ShortText({
            displayName: 'File Name',
            required: false,
            description: "my-file-name (no extension)"
        }),
        acl: Property.ShortText({
            displayName: 'ACL',
            required: false
        })
    },
    async run(context) {
        const { accessKeyId, secretAccessKey, region, bucket } = context.propsValue.authentication;
        const { url, imageName, acl } = context.propsValue;
        const s3 = new S3({
            credentials: {
                accessKeyId,
                secretAccessKey
            },
            region: region || "us-east-1"
        })

        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];
        const [_, ext] = contentType.split("/");
        const extension = "." + ext;

        const generatedName = new Date().toISOString() + Date.now() + extension;

        const finalFileName = imageName ? imageName + extension : generatedName;

        const uploadResponse = await s3.putObject({
            Bucket: bucket,
            Key: finalFileName,
            ACL: (!acl || acl.length === 0) ? undefined: acl,
            ContentType: contentType,
            Body: response.data,
        })

        return {
            fileName: finalFileName,
            url: `https://${bucket}.s3.${region}.amazonaws.com/${finalFileName}`,
            etag: uploadResponse.ETag,
        };
    }
});
