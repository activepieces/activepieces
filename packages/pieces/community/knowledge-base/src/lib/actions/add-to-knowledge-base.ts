import { createAction, Property } from '@activepieces/pieces-framework';
import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';
import { knowledgeBaseAuth } from '../..';
import { getMasterData, getAccessToken, getUserMe } from './search-knowledge-base';
import fetch from 'node-fetch';

const CHUNK_SIZE = 5 * 1024 * 1024;

async function getFileBufferFromHumanInput(fileUrl?: string): Promise<{
  buffer: Buffer;
  mimeType: string;
}> {
  if (fileUrl) {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${await res.text()}`);
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const mimeType = res.headers.get('content-type') ?? 'application/octet-stream';
    return { buffer, mimeType };
  }

  throw new Error('No file input. Please map a File from Human Input or provide a fileUrl.');
}

function sha256Hex(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function uploadChunk(
  accessToken: string,
  endpoint: string,
  chunk: Buffer,
  name: string,
  total: number,
  index: number,
  size: number,
  hash: string,
) {
  const form = new FormData();
  form.append('file', chunk, { filename: `${name}.part.${index}` });
  form.append('name', name);
  form.append('total', String(total));
  form.append('index', String(index));
  form.append('size', String(size));
  form.append('hash', hash);

  const resp = await fetch(`${endpoint}/uploadSplit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form as any,
  });
  if (!resp.ok) {
    throw new Error(`uploadSplit failed (chunk ${index}/${total}): ${resp.status} ${await resp.text()}`);
  }
}

export const addToKnowledgeBase = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'addToKnowledgeBase',
  displayName: 'Add to Knowledge Base',
  description:
    'Upload a file to a Knowledge Base collection. Supports normal upload or split-chunk upload to KnowledgeBaseFileService/uploadSplit.', auth: knowledgeBaseAuth,
  props: {
    fileUrl: Property.ShortText({
      displayName: 'File URL',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      required: true,
    }),
    parentFolderId: Property.Dropdown({
      displayName: 'Parent Folder ID',
      required: false,
      defaultValue: '',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your connection first',
            options: [],
          };
        }
        try {
          const masterData = await getMasterData(auth);
          const accessToken = await getAccessToken(masterData.CENTER_AUTH_LOGIN_URL, auth) || '';
          const userMe = await getUserMe(masterData.CENTER_API_USERS_ME_URL, accessToken);

          const response = await axios.get(
            masterData.KNOWLEDGE_BASE_URL + `/getFiles?userId=` + userMe.id + `&offset=0&limitOfset=30&parentFolderId=&tag=search&keyword=$$_EMPTY_$$&searchDir=Y&type=DIRECTORY`,
            {
              headers: {
                'Authorization': `Bearer ` + accessToken,
                'Content-Type': 'application/json',
              },
            }
          );

          return {
            disabled: false,
            options: response.data.data.map((knowledgebaseResult: any) => {
              return {
                label: knowledgebaseResult.file_name,
                value: knowledgebaseResult.file_app_id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load list collection, Connection is invalid",
          };
        }
      },
    }),
    tagNames: Property.ShortText({
      displayName: 'Tags (comma-separated)',
      required: false,
      defaultValue: '',
    }),
    chunkSizeMB: Property.Number({
      displayName: 'Chunk Size (MB)',
      required: true,
      defaultValue: 5,
    }),
  },
  async run(ctx) {
    const { fileUrl, fileName, parentFolderId, tagNames, chunkSizeMB, } = ctx.propsValue;

    try {
      const auth = ctx.auth;
      const masterData = await getMasterData(auth);
      const accessToken = await getAccessToken(masterData.CENTER_AUTH_LOGIN_URL, auth) || '';
      const userMe = await getUserMe(masterData.CENTER_API_USERS_ME_URL, accessToken);

      const { buffer, mimeType: detectedMime } = await getFileBufferFromHumanInput(fileUrl);

      const size = buffer.length;
      const mimeType = detectedMime;
      const fullName = `${fileName}`;

      const hash = sha256Hex(buffer);

      const actualChunkSize = Math.max(1, Math.floor((chunkSizeMB ?? (CHUNK_SIZE / (1024 * 1024))) * 1024 * 1024));
      const total = Math.ceil(size / actualChunkSize) || 1;

      for (let i = 0; i < total; i++) {
        const start = i * actualChunkSize;
        const end = Math.min(start + actualChunkSize, size);
        const chunk = buffer.subarray(start, end);
        await uploadChunk(accessToken, masterData.KNOWLEDGE_BASE_URL, chunk, fileName, total, i, size, hash);
      }

      const mergeBody = {
        size,
        name: fullName,
        total,
        fileName,
        userId: userMe.id,
        parentFolderId: parentFolderId ?? '',
        cancelCheckOut: false,
        cancelCheckOutFileId: null,
        hash,
        mimeType,
        moduleName: null,
        tagNames: tagNames ?? '',
        detail: '',
      };

      const mergeResp = await fetch(`${masterData.KNOWLEDGE_BASE_URL}/merge_chunks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mergeBody),
      });

      if (!mergeResp.ok) {
        throw new Error(`merge_chunks failed: ${mergeResp.status} ${await mergeResp.text()}`);
      }

      return await mergeResp.json();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError: any = error as AxiosError;
        throw new Error(
          `Knowledgebase API Error: ${axiosError.response?.data?.message ||
          axiosError.message ||
          'Unknown error occurred'
          }`
        );
      }
      throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
