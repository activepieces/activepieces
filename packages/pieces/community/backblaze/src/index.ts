import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { readBackBlazeFileAction } from './lib/actions/read-file';
import { backBlazes3UploadFileAction } from './lib/actions/upload-file';
import { backblazeCommon } from './lib/common';
import { newBackBlazeFileTrigger } from './lib/triggers/new-file';
import { backblazeListFilesAi } from './lib/actions/ai/list-files';
import { backblazeGetFileMetadataAi } from './lib/actions/ai/get-file-metadata';
import { backblazeReadFileAi } from './lib/actions/ai/read-file';
import { backblazeUploadFileAi } from './lib/actions/ai/upload-file';
import { backblazeCopyFileAi } from './lib/actions/ai/copy-file';
import { backblazeDeleteFileAi } from './lib/actions/ai/delete-file';

const description = `
This piece allows you to upload files to BackBlaze Bucket compatible services.

BackBlaze Settings:
Regions: https://www.backblaze.com/apidocs/introduction-to-the-s3-compatible-api
Endpoint: the S3 endpoint shown on your bucket's page, e.g. s3.us-west-004.backblazeb2.com.
Or leave Endpoint blank and choose your bucket's Backblaze region (e.g. us-west-004) in Region.
Access Key ID / Secret Access Key: your Application Key ID and Application Key.
`;

export const backBlazeS3Auth = PieceAuth.CustomAuth({
  description: description,
  props: {
    accessKeyId: Property.ShortText({
      displayName: 'Access Key ID',
      required: true,
    }),
    secretAccessKey: PieceAuth.SecretText({
      displayName: 'Secret Access Key',
      required: true,
    }),
    bucket: Property.ShortText({
      displayName: 'Bucket',
      required: true,
    }),
    endpoint: Property.ShortText({
      displayName: 'Endpoint',
      required: false,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      options: {
        options: [
          {
            label: 'Backblaze US West [us-west-001]',
            value: 'us-west-001',
          },
          {
            label: 'Backblaze US West [us-west-002]',
            value: 'us-west-002',
          },
          {
            label: 'Backblaze US West [us-west-004]',
            value: 'us-west-004',
          },
          {
            label: 'Backblaze US East [us-east-005]',
            value: 'us-east-005',
          },
          {
            label: 'Backblaze EU Central [eu-central-003]',
            value: 'eu-central-003',
          },
          {
            label: 'Backblaze Canada East [ca-east-006]',
            value: 'ca-east-006',
          },
          {
            label: 'US East (N. Virginia) [us-east-1]',
            value: 'us-east-1',
          },
          {
            label: 'US East (Ohio) [us-east-2]',
            value: 'us-east-2',
          },
          {
            label: 'US West (N. California) [us-west-1]',
            value: 'us-west-1',
          },
          {
            label: 'US West (Oregon) [us-west-2]',
            value: 'us-west-2',
          },
          {
            label: 'Africa (Cape Town) [af-south-1]',
            value: 'af-south-1',
          },
          {
            label: 'Asia Pacific (Hong Kong) [ap-east-1]',
            value: 'ap-east-1',
          },
          {
            label: 'Asia Pacific (Mumbai) [ap-south-1]',
            value: 'ap-south-1',
          },
          {
            label: 'Asia Pacific (Osaka-Local) [ap-northeast-3]',
            value: 'ap-northeast-3',
          },
          {
            label: 'Asia Pacific (Seoul) [ap-northeast-2]',
            value: 'ap-northeast-2',
          },
          {
            label: 'Asia Pacific (Singapore) [ap-southeast-1]',
            value: 'ap-southeast-1',
          },
          {
            label: 'Asia Pacific (Sydney) [ap-southeast-2]',
            value: 'ap-southeast-2',
          },
          {
            label: 'Asia Pacific (Tokyo) [ap-northeast-1]',
            value: 'ap-northeast-1',
          },
          {
            label: 'Canada (Central) [ca-central-1]',
            value: 'ca-central-1',
          },
          {
            label: 'Europe (Frankfurt) [eu-central-1]',
            value: 'eu-central-1',
          },
          {
            label: 'Europe (Ireland) [eu-west-1]',
            value: 'eu-west-1',
          },
          {
            label: 'Europe (London) [eu-west-2]',
            value: 'eu-west-2',
          },
          {
            label: 'Europe (Milan) [eu-south-1]',
            value: 'eu-south-1',
          },
          {
            label: 'Europe (Paris) [eu-west-3]',
            value: 'eu-west-3',
          },
          {
            label: 'Europe (Stockholm) [eu-north-1]',
            value: 'eu-north-1',
          },
          {
            label: 'Middle East (Bahrain) [me-south-1]',
            value: 'me-south-1',
          },
          {
            label: 'South America (São Paulo) [sa-east-1]',
            value: 'sa-east-1',
          },
          {
            label: 'Europe (Spain) [eu-south-2]',
            value: 'eu-south-2',
          },
          {
            label: 'Asia Pacific (Hyderabad) [ap-south-2]',
            value: 'ap-south-2',
          },
          {
            label: 'Asia Pacific (Jakarta) [ap-southeast-3]',
            value: 'ap-southeast-3',
          },
          {
            label: 'Asia Pacific (Melbourne) [ap-southeast-4]',
            value: 'ap-southeast-4',
          },
          {
            label: 'China (Beijing) [cn-north-1]',
            value: 'cn-north-1',
          },
          {
            label: 'China (Ningxia) [cn-northwest-1]',
            value: 'cn-northwest-1',
          },
          {
            label: 'Europe (Zurich) [eu-central-2]',
            value: 'eu-central-2',
          },
          {
            label: 'Middle East (UAE) [me-central-1]',
            value: 'me-central-1',
          },
        ],
      },
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const s3 = backblazeCommon.createBackBlazeS3(auth);
    try {
      await s3.listObjectsV2({
        Bucket: auth.bucket,
        MaxKeys: 1,
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: backblazeCommon.describeValidationError(e),
      };
    }
  },
  required: true,
});

export const backblaze = createPiece({
  displayName: 'Backblaze',
  description: 'Scalable storage in the cloud',
  logoUrl: 'https://cdn.activepieces.com/pieces/backblaze.png',
  minimumSupportedRelease: '0.86.4',
  authors: ["nhnansari","kishanprmr"],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: backBlazeS3Auth,
  actions: [
    backBlazes3UploadFileAction,
    readBackBlazeFileAction,
    backblazeListFilesAi,
    backblazeGetFileMetadataAi,
    backblazeReadFileAi,
    backblazeUploadFileAi,
    backblazeCopyFileAi,
    backblazeDeleteFileAi,
  ],
  triggers: [newBackBlazeFileTrigger],
});
