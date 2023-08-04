import { PieceAuth, Property, createPiece } from "@activepieces/pieces-framework";
import { amazonS3UploadBase64FileAction } from "./lib/actions/upload-file-from-base64";
import { amazonS3UploadFileFromUrlAction } from "./lib/actions/upload-file-from-url";
import { newFile } from "./lib/triggers/new-file";
import { readFile } from "./lib/actions/read-file";

export const amazonS3Auth = PieceAuth.CustomAuth({
    displayName: 'Authentication',
    props: {
        accessKeyId: Property.ShortText({
            displayName: 'Access Key ID',
            required: true,
        }),
        secretAccessKey: PieceAuth.SecretText({
            displayName: 'Secret Access Key',
            required: true,
        }),
        region: Property.StaticDropdown({
            displayName: 'Region',
            options: {
                "options": [
                    {
                        "label": "US East (N. Virginia) [us-east-1]",
                        "value": "us-east-1"
                    },
                    {
                        "label": "US East (Ohio) [us-east-2]",
                        "value": "us-east-2"
                    },
                    {
                        "label": "US West (N. California) [us-west-1]",
                        "value": "us-west-1"
                    },
                    {
                        "label": "US West (Oregon) [us-west-2]",
                        "value": "us-west-2"
                    },
                    {
                        "label": "Africa (Cape Town) [af-south-1]",
                        "value": "af-south-1"
                    },
                    {
                        "label": "Asia Pacific (Hong Kong) [ap-east-1]",
                        "value": "ap-east-1"
                    },
                    {
                        "label": "Asia Pacific (Mumbai) [ap-south-1]",
                        "value": "ap-south-1"
                    },
                    {
                        "label": "Asia Pacific (Osaka-Local) [ap-northeast-3]",
                        "value": "ap-northeast-3"
                    },
                    {
                        "label": "Asia Pacific (Seoul) [ap-northeast-2]",
                        "value": "ap-northeast-2"
                    },
                    {
                        "label": "Asia Pacific (Singapore) [ap-southeast-1]",
                        "value": "ap-southeast-1"
                    },
                    {
                        "label": "Asia Pacific (Sydney) [ap-southeast-2]",
                        "value": "ap-southeast-2"
                    },
                    {
                        "label": "Asia Pacific (Tokyo) [ap-northeast-1]",
                        "value": "ap-northeast-1"
                    },
                    {
                        "label": "Canada (Central) [ca-central-1]",
                        "value": "ca-central-1"
                    },
                    {
                        "label": "Europe (Frankfurt) [eu-central-1]",
                        "value": "eu-central-1"
                    },
                    {
                        "label": "Europe (Ireland) [eu-west-1]",
                        "value": "eu-west-1"
                    },
                    {
                        "label": "Europe (London) [eu-west-2]",
                        "value": "eu-west-2"
                    },
                    {
                        "label": "Europe (Milan) [eu-south-1]",
                        "value": "eu-south-1"
                    },
                    {
                        "label": "Europe (Paris) [eu-west-3]",
                        "value": "eu-west-3"
                    },
                    {
                        "label": "Europe (Stockholm) [eu-north-1]",
                        "value": "eu-north-1"
                    },
                    {
                        "label": "Middle East (Bahrain) [me-south-1]",
                        "value": "me-south-1"
                    },
                    {
                        "label": "South America (São Paulo) [sa-east-1]",
                        "value": "sa-east-1"
                    },
                    {
                        "label": "Europe (Spain) [eu-south-2]",
                        "value": "eu-south-2"
                    },
                    {
                        "label": "Asia Pacific (Hyderabad) [ap-south-2]",
                        "value": "ap-south-2"
                    },
                    {
                        "label": "Asia Pacific (Jakarta) [ap-southeast-3]",
                        "value": "ap-southeast-3"
                    },
                    {
                        "label": "Asia Pacific (Melbourne) [ap-southeast-4]",
                        "value": "ap-southeast-4"
                    },
                    {
                        "label": "China (Beijing) [cn-north-1]",
                        "value": "cn-north-1"
                    },
                    {
                        "label": "China (Ningxia) [cn-northwest-1]",
                        "value": "cn-northwest-1"
                    },
                    {
                        "label": "Europe (Zurich) [eu-central-2]",
                        "value": "eu-central-2"
                    },
                    {
                        "label": "Middle East (UAE) [me-central-1]",
                        "value": "me-central-1"
                    }
                ]
            },
            required: true,
        }),

        bucket: Property.ShortText({
            displayName: 'Bucket',
            required: true,
        })
    },
    required: true
})

export const amazonS3 = createPiece({
    displayName: "Amazon S3",

    logoUrl: "https://cdn.activepieces.com/pieces/amazon-s3.png",
    minimumSupportedRelease: '0.5.0',
    authors: ["Willianwg", 'MoShizzle'],
    auth: amazonS3Auth,
    actions: [
        amazonS3UploadBase64FileAction,
        amazonS3UploadFileFromUrlAction,
        readFile
    ],
    triggers: [
        newFile
    ],
});
