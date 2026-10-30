import { FilesService } from '@activepieces/pieces-framework';
import { ILoveApiTool, ProcessResponse } from './types';
import { RunTaskInput, UploadInput, iLoveApi } from './client';

export async function runAndStoreResult(input: RunAndStoreInput): Promise<RunAndStoreResult> {
  const { output } = await runAndStoreWithBuffer(input);
  return output;
}

export async function runAndStoreWithBuffer({
  auth,
  files,
  ...input
}: RunAndStoreInput): Promise<{ output: RunAndStoreResult; buffer: Buffer }> {
  const result = await iLoveApi.runTask({ ...input, publicKey: auth });
  if (!result.buffer) {
    throw new Error('iLoveAPI returned no output file.');
  }
  const fileName = result.downloadFilename || `${input.tool}-${result.task}`;
  const storedFile = await files.write({ fileName, data: result.buffer });

  const output: RunAndStoreResult = {
    output_file: storedFile,
    download_filename: fileName,
    output_filenumber: result.process.output_filenumber,
    output_filesize: result.process.output_filesize ?? result.buffer.length,
    filesize: result.process.filesize,
    output_extensions: result.process.output_extensions,
    status: result.process.status,
    timer: result.process.timer,
    task: result.task,
    remaining_credits: result.remainingCredits,
    process: result.process,
  };
  return { output, buffer: result.buffer };
}

export type RunAndStoreInput = Omit<RunTaskInput, 'publicKey'> & {
  auth: string;
  files: FilesService;
};

export type RunAndStoreResult = {
  output_file: string;
  download_filename: string;
  output_filenumber?: number;
  output_filesize?: number;
  filesize?: number;
  output_extensions?: string[];
  status?: string;
  timer?: string;
  task: string;
  remaining_credits?: number;
  process: ProcessResponse;
};

export type ToolUploadInput = UploadInput;
export type ToolName = ILoveApiTool;
