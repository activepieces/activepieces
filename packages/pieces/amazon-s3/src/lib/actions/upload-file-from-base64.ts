import { createAction, Property } from "@activepieces/pieces-framework";
import { S3 } from "@aws-sdk/client-s3";
import { auth } from "../common/auth";

export const uploadBase64File = createAction({
    name: 'upload-base64-file',
    displayName: "Upload base64 File",
    description: "Upload an File to S3 by using it's base64 string",
    props: {
        authentication: auth,
        base64: Property.LongText({
            displayName: 'Base64',
            required: true,
        }),
        fileName: Property.ShortText({
            displayName: 'File Name',
            required: false,
            description: "my-file-name (no extension)"
        }),
        acl: Property.StaticDropdown({
            displayName: 'ACL',
            required: false,
            options: {
                options: [
                    {
                        label: "private",
                        value: "private"
                    },
                    {
                        label: "public-read",
                        value: "public-read"
                    },
                    {
                        label: "public-read-write",
                        value: "public-read-write"
                    },
                    {
                        label: "authenticated-read",
                        value: "authenticated-read"
                    },
                    {
                        label: "aws-exec-read",
                        value: "aws-exec-read"
                    },
                    {
                        label: "bucket-owner-read",
                        value: "bucket-owner-read"
                    },
                    {
                        label: "bucket-owner-full-control",
                        value: "bucket-owner-full-control"
                    }
                ]
            }
        }),        
        type: Property.StaticDropdown({
            displayName: 'Type',
            required: true,
            options: {
                options: [
                    {
                        label: "image/png",
                        value: "image/png"
                    },
                    {
                        label: "image/jpeg",
                        value: "image/jpeg"
                    },
                    {
                        label: "image/gif",
                        value: "image/gif"
                    },
                    {
                        label: "audio/mpeg",
                        value: "audio/mpeg"
                    },
                    {
                        label: "audio/wav",
                        value: "audio/wav"
                    },
                    {
                        label: "video/mp4",
                        value: "video/mp4"
                    },
                    {
                        label: "application/pdf",
                        value: "application/pdf"
                    },
                    {
                        label: "application/msword",
                        value: "application/msword"
                    },
                    {
                        label: "text/plain",
                        value: "text/plain"
                    },
                    {
                        label: "application/json",
                        value: "application/json"
                    }
                ]
            }
        }),
    },
    async run(context) {
        const { accessKeyId, secretAccessKey, region, bucket } = context.propsValue.authentication;
        const { base64, fileName: imageName, acl, type } = context.propsValue;

        const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');

        const s3 = new S3({
            credentials: {
                accessKeyId,
                secretAccessKey
            },
            region: region || "us-east-1"
        })

        const contentType = type;
        const [_, ext] = contentType.split("/");
        const extension = "." + ext;

        const generatedName = new Date().toISOString() + Date.now() + extension;

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
