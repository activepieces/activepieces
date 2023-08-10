import assert from 'node:assert';
import { PieceMetadata } from '../../../packages/pieces/framework/src';
import { StatusCodes } from 'http-status-codes';
import { HttpHeader } from '../../../packages/pieces/common/src';

assert(process.env['AP_CLOUD_API_KEY'], 'API Key is not defined');

const { AP_CLOUD_API_KEY } = process.env;
const AP_CLOUD_API_BASE = 'https://cloud.activepieces.com/api/v1';

const insertPieceMetadata = async (
  pieceMetadata: PieceMetadata
): Promise<void> => {
  const body = JSON.stringify(pieceMetadata);

  const headers = {
    [HttpHeader.API_KEY]: AP_CLOUD_API_KEY,
    [HttpHeader.CONTENT_TYPE]: 'application/json'
  };

  const cloudResponse = await fetch(`${AP_CLOUD_API_BASE}/admin/pieces`, {
    method: 'POST',
    headers,
    body
  });

  if (cloudResponse.status !== StatusCodes.OK) {
    throw new Error(await cloudResponse.text());
  }
};

const pieceMetadataExists = async (
  pieceName: string,
  pieceVersion: string
): Promise<boolean> => {
  const cloudResponse = await fetch(
    `${AP_CLOUD_API_BASE}/pieces/${pieceName}?version=${pieceVersion}`
  );

  const pieceExist: Record<number, boolean> = {
    [StatusCodes.OK]: true,
    [StatusCodes.NOT_FOUND]: false
  };

  if (
    pieceExist[cloudResponse.status] === null ||
    pieceExist[cloudResponse.status] === undefined
  ) {
    throw new Error(await cloudResponse.text());
  }

  return pieceExist[cloudResponse.status];
};

const insertMetadataIfNotExist = async (pieceMetadata: PieceMetadata) => {
  console.info(
    `insertMetadataIfNotExist, name: ${pieceMetadata.name}, version: ${pieceMetadata.version}`
  );

  const metadataAlreadyExist = await pieceMetadataExists(
    pieceMetadata.name,
    pieceMetadata.version
  );

  if (metadataAlreadyExist) {
    console.info(`insertMetadataIfNotExist, piece metadata already inserted`);
    return;
  }

  await insertPieceMetadata(pieceMetadata);
};

export const insertMetadata = async (piecesMetadata: PieceMetadata[]) => {
  for (const pieceMetadata of piecesMetadata) {
    await insertMetadataIfNotExist(pieceMetadata);
  }
};
