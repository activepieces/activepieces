import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { readFile } from './lib/actions/read-file';
import { amazons3UploadFile } from './lib/actions/upload-file';
import { createS3 } from './lib/common';
import { newFile } from './lib/triggers/new-file';
import { generateSignedUrl } from './lib/actions/generate-signed-url';
import { moveFile } from './lib/actions/move-file';
import { deleteFile } from './lib/actions/delete-file';
import { listFiles } from './lib/actions/list-files';
import { decryptPgpFile } from './lib/actions/decrypt-pgp-file';
import { amazonS3Auth } from './lib/auth';

const description = `
This piece allows you to upload files to Amazon S3 or other S3 compatible services.

Amazon S3 Settings:
Regions: https://docs.aws.amazon.com/general/latest/gr/s3.html
Endpoint: leave blank
`;

export const amazonS3 = createPiece({
  displayName: 'Amazon S3',
  description: 'Scalable storage in the cloud',

  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-s3.png',
  minimumSupportedRelease: '0.30.0',
  authors: ["Willianwg","kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud", "Kevinyu-alan"],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: amazonS3Auth,
  actions: [amazons3UploadFile, readFile, generateSignedUrl, moveFile, deleteFile, listFiles, decryptPgpFile],
  triggers: [newFile],
});
