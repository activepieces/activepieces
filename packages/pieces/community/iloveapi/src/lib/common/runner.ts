import { FilesService } from '@activepieces/pieces-framework';
import { ILoveApiTool, ProcessResponse } from './types';
import { RunTaskInput, UploadInput, iLoveApi } from './client';

export type RunAndStoreInput = Omit<RunTaskInput, 'publicKey'> & {
  auth: string;
  files: FilesService;
};

export type RunAndStoreResult = {
  output_file: string;
  download_filename: string;
  output_filenumber?: number;
  output_filesize?: number;
  output_extensions?: string[];
  status?: string;
  process: ProcessResponse;
};

export async function runAndStoreResult({
  auth,
  files,
  tool,
  uploads,
  options,
  output_filename,
  packaged_filename,
  perFileOverrides,
  extraUploads,
}: RunAndStoreInput): Promise<RunAndStoreResult> {
  const result = await iLoveApi.runTask({
    publicKey: auth,
    tool,
    uploads,
    options,
    output_filename,
    packaged_filename,
    perFileOverrides,
    extraUploads,
  });

  const storedFile = await files.write({
    fileName: result.downloadFilename,
    data: result.buffer,
  });

  return {
    output_file: storedFile,
    download_filename: result.downloadFilename,
    output_filenumber: result.process.output_filenumber,
    output_filesize: result.process.output_filesize,
    output_extensions: result.process.output_extensions,
    status: result.process.status,
    process: result.process,
  };
}

export type ToolUploadInput = UploadInput;
export type ToolName = ILoveApiTool;
