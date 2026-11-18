import { OutputSchema } from '@activepieces/pieces-framework';

export const invokeFunctionOutputSchema: OutputSchema = {
  fields: [
    { key: 'statusCode', label: 'Status Code', format: 'number' },
    { key: 'functionError', label: 'Function Error' },
    { key: 'executedVersion', label: 'Executed Version' },
    { key: 'payload', label: 'Payload' },
  ],
};

export const getFunctionDetailsOutputSchema: OutputSchema = {
  fields: [
    { key: 'functionName', label: 'Function Name' },
    { key: 'functionArn', label: 'Function ARN' },
    { key: 'description', label: 'Description' },
    { key: 'runtime', label: 'Runtime' },
    { key: 'handler', label: 'Handler' },
    { key: 'memorySize', label: 'Memory (MB)', format: 'number' },
    { key: 'timeout', label: 'Timeout (seconds)', format: 'number' },
    { key: 'role', label: 'Execution Role ARN' },
    { key: 'state', label: 'State' },
    { key: 'version', label: 'Version' },
    { key: 'lastModified', label: 'Last Modified' },
    { key: 'environment', label: 'Environment Variables', dynamicKey: true },
  ],
};
