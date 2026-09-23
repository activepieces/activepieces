import { randomUUID } from 'crypto';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createAction, Property, tryCatch } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlBulkOperation,
  GqlStagedTarget,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

const JSONL_FILENAME = 'bulk_op_vars.jsonl';
const JSONL_MIME_TYPE = 'text/jsonl';
const STAGED_PATH_PARAMETER = 'key';
const MAX_UPLOAD_ERROR_BODY = 500;

export const shopifyAiStartBulkMutation = createAction({
  auth: shopifyAuth,
  name: 'start_bulk_mutation',
  classification: 'WRITE',
  displayName: 'Start Bulk Mutation',
  description: 'Run one GraphQL mutation many times in the background, once per variables object.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts a Shopify bulk mutation operation that runs the given GraphQL mutation once for every object in variables (for example create or update thousands of products), and returns only the operation (bulk_operation_id and status). In one call it uploads the variables as a JSONL file to Shopify\'s staged upload storage and then starts the operation, so there is nothing else to upload. Poll get_bulk_operation with the id until status is COMPLETED, then download the JSONL result file from its url (one line per input line, including any userErrors per line). The mutation must be a single mutation that takes its input from variables, and it needs the access scopes it would need normally. These are real writes applied in bulk and a started operation cannot be undone, only stopped early with cancel_bulk_operation (lines already processed stay applied), so confirm the mutation and the number of lines with the user first. From API version 2026-01 each app can run up to five bulk mutations per shop at the same time. Each call starts another operation and would apply every line again, so never repeat it after a success.',
    idempotent: false,
  },
  props: {
    mutation: Property.LongText({
      displayName: 'Mutation',
      description:
        'One GraphQL Admin mutation that reads its input from variables, for example "mutation call($product: ProductCreateInput!) { productCreate(product: $product) { product { id title } userErrors { field message } } }".',
      required: true,
    }),
    variables: Property.Json({
      displayName: 'Variables per Execution',
      description:
        'A JSON array with one object per execution; each object holds the variables for one run of the mutation, for example [{"product": {"title": "Sweater"}}, {"product": {"title": "Scarf"}}].',
      required: true,
    }),
    client_identifier: Property.ShortText({
      displayName: 'Client Identifier',
      description: 'Optional label of your own to recognise the operation later.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const mutation = shopifyValues.nonEmpty(propsValue.mutation);
    if (!mutation || !/^\s*mutation\b/i.test(mutation)) {
      throw new Error('mutation must be a GraphQL mutation document starting with "mutation". Nothing was started.');
    }
    const lines = readVariableLines(propsValue.variables);
    const staged = await shopifyGraphqlClient.request<{
      stagedUploadsCreate: { stagedTargets?: GqlStagedTarget[] | null } | null;
    }>({
      auth,
      query: `mutation StageBulkMutationVariables($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } } }`,
      variables: {
        input: [
          {
            resource: 'BULK_MUTATION_VARIABLES',
            filename: JSONL_FILENAME,
            mimeType: JSONL_MIME_TYPE,
            httpMethod: 'POST',
          },
        ],
      },
    });
    const target = staged.data.stagedUploadsCreate?.stagedTargets?.[0];
    const uploadUrl = target?.url;
    const parameters = target?.parameters ?? [];
    const stagedUploadPath = parameters.find((parameter) => parameter.name === STAGED_PATH_PARAMETER)?.value;
    if (!uploadUrl || !stagedUploadPath) {
      throw new Error('Shopify did not return a staged upload target for the variables file. Nothing was started.');
    }
    const multipart = buildMultipart({
      fields: parameters,
      fileContent: lines.join('\n'),
    });
    const upload = await tryCatch(() =>
      httpClient.sendRequest({
        method: HttpMethod.POST,
        url: uploadUrl,
        headers: { 'Content-Type': multipart.contentType },
        body: multipart.body,
        responseType: 'text',
      })
    );
    if (upload.error) {
      throw new Error(`Uploading the variables file to Shopify's staged storage failed: ${describeUploadError(upload.error)}. Nothing was started.`);
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      bulkOperationRunMutation: { bulkOperation: GqlBulkOperation | null } | null;
    }>({
      auth,
      query: `mutation StartBulkMutation($mutation: String!, $stagedUploadPath: String!, $clientIdentifier: String) { bulkOperationRunMutation(mutation: $mutation, stagedUploadPath: $stagedUploadPath, clientIdentifier: $clientIdentifier) { bulkOperation { ${shopifyFields.BULK_OPERATION_FIELDS} } userErrors { field message code } } }`,
      variables: {
        mutation,
        stagedUploadPath,
        clientIdentifier: shopifyValues.nonEmpty(propsValue.client_identifier),
      },
    });
    const operation = data.bulkOperationRunMutation?.bulkOperation;
    if (!operation) {
      throw new Error('Shopify did not return the bulk operation.');
    }
    return {
      bulk_operation_id: operation.id,
      ...shopifyMappers.mapBulkOperation(operation),
      line_count: lines.length,
      staged_upload_path: stagedUploadPath,
      redacted_fields: [...staged.redactedFields, ...redactedFields],
    };
  },
});

function describeUploadError(error: Error): string {
  if (!(error instanceof HttpError)) {
    return error.message;
  }
  const body = error.response.body;
  const text = typeof body === 'string' ? body : JSON.stringify(body ?? '');
  const detail = text.length > MAX_UPLOAD_ERROR_BODY ? `${text.slice(0, MAX_UPLOAD_ERROR_BODY)}…` : text;
  return `the storage host returned HTTP ${error.response.status}: ${detail}`;
}

function readVariableLines(value: unknown): string[] {
  const list = Array.isArray(value) ? value : readJsonArray(value);
  if (!list || list.length === 0) {
    throw new Error('variables must be a JSON array with at least one object, one per execution. Nothing was started.');
  }
  return list.map((item, index) => {
    if (!shopifyValues.isRecord(item)) {
      throw new Error(`variables[${index}] must be an object of mutation variables. Nothing was started.`);
    }
    return JSON.stringify(item);
  });
}

function readJsonArray(value: unknown): unknown[] | undefined {
  if (typeof value !== 'string' || !value.trim().startsWith('[')) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function buildMultipart({
  fields,
  fileContent,
}: {
  fields: { name: string; value: string }[];
  fileContent: string;
}): { body: Buffer; contentType: string } {
  const boundary = `----ShopifyBulkUpload${randomUUID().replace(/-/g, '')}`;
  const fieldParts = fields.map(
    (field) => `--${boundary}\r\nContent-Disposition: form-data; name="${field.name}"\r\n\r\n${field.value}\r\n`
  );
  const filePart = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${JSONL_FILENAME}"\r\nContent-Type: ${JSONL_MIME_TYPE}\r\n\r\n${fileContent}\r\n--${boundary}--\r\n`;
  return {
    body: Buffer.from([...fieldParts, filePart].join(''), 'utf8'),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}
