import { S3 } from "@aws-sdk/client-s3";


export function createS3(auth: { accessKeyId: string; secretAccessKey: string; region: string | undefined; endpoint: string | undefined; }) {
    const s3 = new S3({
        credentials: {
            accessKeyId: auth.accessKeyId,
            secretAccessKey: auth.secretAccessKey,
        },
        forcePathStyle: auth.endpoint ? true : false,
        region: auth.region,
        endpoint: auth.endpoint,
    });
    return s3;
}