import { FilesService, OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';
import { DatalabActionOutput, datalabClient, DatalabOperation } from '../common/client';
import { datalabGuards } from '../common/guards';
import { datalabProps } from '../common/props';
import { convertOperation, ConvertOutput } from './convert';
import { createDocumentOperation, CreateDocumentOutput } from './create-document';
import { extractOperation, ExtractOutput } from './extract';
import { fillOperation, FillOutput } from './fill';
import { formFieldsOperation, FormFieldsOutput } from './form-fields';
import { segmentOperation, SegmentOutput } from './segment';

const HANDLERS: Record<DatalabOperation, OperationHandler> = {
  convert: {
    hasOutput: convertOperation.hasOutput,
    shape: ({ result, files }) => convertOperation.shape({ result, files }),
    outputSchema: convertOperation.outputSchema,
  },
  extract: {
    hasOutput: extractOperation.hasOutput,
    shape: ({ result, files }) => extractOperation.shape({ result, files }),
    outputSchema: extractOperation.outputSchema,
  },
  segment: {
    hasOutput: segmentOperation.hasOutput,
    shape: ({ result, files }) => segmentOperation.shape({ result, files }),
    outputSchema: segmentOperation.outputSchema,
  },
  fill: {
    hasOutput: fillOperation.hasOutput,
    shape: ({ result, files }) => fillOperation.shape({ result, files }),
    outputSchema: fillOperation.outputSchema,
  },
  'form-fields': {
    hasOutput: formFieldsOperation.hasOutput,
    shape: ({ result, files }) => formFieldsOperation.shape({ result, files }),
    outputSchema: formFieldsOperation.outputSchema,
  },
  'create-document': {
    hasOutput: createDocumentOperation.hasOutput,
    shape: ({ result, files }) => createDocumentOperation.shape({ result, files }),
    outputSchema: createDocumentOperation.outputSchema,
  },
};

const OPERATIONS: DatalabOperation[] = Object.keys(datalabClient.OPERATION_LABELS).filter(isOperation);

const DETECTION_ORDER: DatalabOperation[] = ['extract', 'segment', 'create-document', 'fill', 'form-fields', 'convert'];

function isOperation(value: string): value is DatalabOperation {
  return Object.prototype.hasOwnProperty.call(HANDLERS, value);
}

function labelOf(operation: DatalabOperation): string {
  return datalabClient.OPERATION_LABELS[operation];
}

function operationOptions(): Array<{ label: string; value: DatalabOperation }> {
  return OPERATIONS.map((operation) => ({ label: labelOf(operation), value: operation }));
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

function readOperation(value: unknown): DatalabOperation {
  const given = datalabGuards.text(value);
  const wanted = given === undefined ? undefined : normalize(given);
  const match = OPERATIONS.find((operation) => normalize(operation) === wanted || normalize(labelOf(operation)) === wanted);
  if (match !== undefined) {
    return match;
  }
  const valid = OPERATIONS.map((operation) => `${operation} (${labelOf(operation)})`).join(', ');
  const problem = given === undefined ? 'Operation is empty' : `Operation "${given}" is not valid`;
  throw new Error(`${problem}. Pick the action that created the request, one of: ${valid}.`);
}

function readRequestId(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function detectOperation(result: Record<string, unknown>): DatalabOperation | undefined {
  return DETECTION_ORDER.find((operation) => HANDLERS[operation].hasOutput(result));
}

function assertBelongs({ operation, result, requestId }: { operation: DatalabOperation; result: Record<string, unknown>; requestId: string }): void {
  const actual = detectOperation(result);
  if (actual === operation) {
    return;
  }
  const chosen = labelOf(operation);
  if (actual === undefined) {
    throw new Error(`Request ${requestId} was not made by ${chosen}: it finished without a ${chosen} result. Pick the action that created it in Operation.`);
  }
  throw new Error(`Request ${requestId} was not made by ${chosen}. Pick the action that created it in Operation: it looks like ${labelOf(actual)}.`);
}

function stillWorkingMessage({ requestId, operation, status }: { requestId: string; operation: DatalabOperation; status: string }): string {
  return `Datalab is still working on request ${requestId} (status: ${status}). Run Get Result again in a little while with Operation "${labelOf(operation)}" and this Request ID. Results are kept for about one day.`;
}

const SHARED_FIELDS: Record<string, OutputSchemaField> = {
  output_format: { key: 'output_format', label: 'Output Format', description: 'The format of the result: markdown, html, json or chunks for Convert Document, pdf or png for Fill Form, docx for Create Document.' },
  file: { key: 'file', label: 'File', format: 'url', description: 'The result file stored in Activepieces, for Fill Form and Create Document. Pass it to any step that takes a file.' },
  file_name: { key: 'file_name', label: 'File Name' },
  size: { key: 'size', label: 'File Size', format: 'filesize' },
};

function buildOutputSchema(): OutputSchema {
  const fields: OutputSchemaField[] = [...datalabProps.envelopeFields()];
  const seen = new Set(fields.map((field) => field.key));
  for (const operation of OPERATIONS) {
    for (const field of HANDLERS[operation].outputSchema.fields) {
      if (!seen.has(field.key)) {
        seen.add(field.key);
        fields.push(SHARED_FIELDS[field.key] ?? field);
      }
    }
  }
  return { fields };
}

async function run({ apiKey, operation, requestId, files }: GetResultRunParams): Promise<DatalabActionOutput<GetResultOutput>> {
  const chosen = readOperation(operation);
  const outcome = await datalabClient.fetchOutcome({ apiKey, operation: chosen, requestId: readRequestId(requestId) });
  if (!outcome.completed) {
    return {
      completed: false,
      status: outcome.status,
      request_id: outcome.requestId,
      message: stillWorkingMessage({ requestId: outcome.requestId, operation: chosen, status: outcome.status }),
    };
  }
  assertBelongs({ operation: chosen, result: outcome.result, requestId: outcome.requestId });
  const shaped = await HANDLERS[chosen].shape({ result: outcome.result, files });
  return { completed: true, status: 'complete', request_id: outcome.requestId, ...shaped };
}

const outputSchema = buildOutputSchema();

export const getResultOperation = { OPERATIONS, DETECTION_ORDER, outputSchema, operationOptions, readOperation, detectOperation, run };

export type GetResultOutput = ConvertOutput | ExtractOutput | SegmentOutput | FillOutput | FormFieldsOutput | CreateDocumentOutput;

export type GetResultRunParams = {
  apiKey: string;
  operation: unknown;
  requestId: unknown;
  files: FilesService;
};

type OperationHandler = {
  hasOutput: (result: Record<string, unknown>) => boolean;
  shape: (params: { result: Record<string, unknown>; files: FilesService }) => Promise<GetResultOutput> | GetResultOutput;
  outputSchema: OutputSchema;
};
