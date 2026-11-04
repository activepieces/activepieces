import { OutputSchema } from '@activepieces/pieces-framework';

export const amazonBedrockConverseOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'output',
      label: 'Output',
      children: [
        {
          key: 'message',
          label: 'Message',
          children: [
            { key: 'role', label: 'Role' },
            { key: 'content', label: 'Content', listItems: [{ key: 'text', label: 'Text' }] },
          ],
        },
      ],
    },
    { key: 'stopReason', label: 'Stop Reason' },
    {
      key: 'usage',
      label: 'Usage',
      children: [
        { key: 'inputTokens', label: 'Input Tokens', format: 'number' },
        { key: 'outputTokens', label: 'Output Tokens', format: 'number' },
        { key: 'totalTokens', label: 'Total Tokens', format: 'number' },
      ],
    },
    {
      key: 'metrics',
      label: 'Metrics',
      children: [{ key: 'latencyMs', label: 'Latency (ms)', format: 'number' }],
    },
  ],
};

export const amazonBedrockCountTokensOutputSchema: OutputSchema = {
  fields: [{ key: 'inputTokens', label: 'Input Tokens', format: 'number' }],
};

export const amazonBedrockCreatePromptOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'id', label: 'ID' },
    { key: 'arn', label: 'ARN' },
    { key: 'version', label: 'Version' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
    { key: 'description', label: 'Description' },
    { key: 'defaultVariant', label: 'Default Variant' },
    {
      key: 'variants',
      label: 'Variants',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'templateType', label: 'Template Type' },
        {
          key: 'templateConfiguration',
          label: 'Template Configuration',
          children: [
            {
              key: 'text',
              label: 'Text',
              children: [
                { key: 'text', label: 'Text' },
                {
                  key: 'inputVariables',
                  label: 'Input Variables',
                  labelKey: 'name',
                  listItems: [{ key: 'name', label: 'Name' }],
                },
              ],
            },
          ],
        },
        { key: 'modelId', label: 'Model ID' },
        {
          key: 'inferenceConfiguration',
          label: 'Inference Configuration',
          children: [
            {
              key: 'text',
              label: 'Text',
              children: [{ key: 'maxTokens', label: 'Max Tokens', format: 'number' }],
            },
          ],
        },
      ],
    },
  ],
};

export const amazonBedrockCreatePromptVersionOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'id', label: 'ID' },
    { key: 'arn', label: 'ARN' },
    { key: 'version', label: 'Version' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
    { key: 'description', label: 'Description' },
    { key: 'defaultVariant', label: 'Default Variant' },
    {
      key: 'variants',
      label: 'Variants',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'templateType', label: 'Template Type' },
        {
          key: 'templateConfiguration',
          label: 'Template Configuration',
          children: [
            {
              key: 'text',
              label: 'Text',
              children: [
                { key: 'text', label: 'Text' },
                {
                  key: 'inputVariables',
                  label: 'Input Variables',
                  labelKey: 'name',
                  listItems: [{ key: 'name', label: 'Name' }],
                },
              ],
            },
          ],
        },
        { key: 'modelId', label: 'Model ID' },
        {
          key: 'inferenceConfiguration',
          label: 'Inference Configuration',
          children: [
            {
              key: 'text',
              label: 'Text',
              children: [
                { key: 'temperature', label: 'Temperature', format: 'number' },
                { key: 'maxTokens', label: 'Max Tokens', format: 'number' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const amazonBedrockCreateSessionOutputSchema: OutputSchema = {
  fields: [
    { key: 'sessionId', label: 'Session ID' },
    { key: 'sessionArn', label: 'Session ARN' },
    { key: 'sessionStatus', label: 'Session Status' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
  ],
};

export const amazonBedrockCreateSessionInvocationOutputSchema: OutputSchema = {
  fields: [{ key: 'invocationId', label: 'Invocation ID' }],
};

export const amazonBedrockDeletePromptOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'ID' }],
};

export const amazonBedrockEndSessionOutputSchema: OutputSchema = {
  fields: [
    { key: 'sessionId', label: 'Session ID' },
    { key: 'sessionArn', label: 'Session ARN' },
    { key: 'sessionStatus', label: 'Session Status' },
  ],
};

export const amazonBedrockGetAccountDataRetentionOutputSchema: OutputSchema = {
  fields: [{ key: 'mode', label: 'Mode' }],
};

export const amazonBedrockGetFoundationModelOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'modelDetails',
      label: 'Model Details',
      children: [
        { key: 'modelArn', label: 'Model ARN' },
        { key: 'modelId', label: 'Model ID' },
        { key: 'modelName', label: 'Model Name' },
        { key: 'providerName', label: 'Provider Name' },
        { key: 'inputModalities', label: 'Input Modalities' },
        { key: 'outputModalities', label: 'Output Modalities' },
        {
          key: 'responseStreamingSupported',
          label: 'Response Streaming Supported',
          format: 'boolean',
        },
        { key: 'customizationsSupported', label: 'Customizations Supported' },
        { key: 'inferenceTypesSupported', label: 'Inference Types Supported' },
        {
          key: 'modelLifecycle',
          label: 'Model Lifecycle',
          children: [
            { key: 'status', label: 'Status' },
            { key: 'startOfLifeTime', label: 'Start Of Life Time', format: 'datetime' },
          ],
        },
      ],
    },
  ],
};

export const amazonBedrockGetFoundationModelAvailabilityOutputSchema: OutputSchema = {
  fields: [
    { key: 'modelId', label: 'Model ID' },
    {
      key: 'agreementAvailability',
      label: 'Agreement Availability',
      children: [{ key: 'status', label: 'Status' }],
    },
    { key: 'authorizationStatus', label: 'Authorization Status' },
    { key: 'entitlementAvailability', label: 'Entitlement Availability' },
    { key: 'regionAvailability', label: 'Region Availability' },
  ],
};

export const amazonBedrockGetInferenceProfileOutputSchema: OutputSchema = {
  fields: [
    { key: 'inferenceProfileName', label: 'Inference Profile Name' },
    { key: 'inferenceProfileArn', label: 'Inference Profile ARN' },
    { key: 'models', label: 'Models', listItems: [{ key: 'modelArn', label: 'Model ARN' }] },
    { key: 'inferenceProfileId', label: 'Inference Profile ID' },
    { key: 'status', label: 'Status' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  ],
};

export const amazonBedrockGetModelInvocationLoggingConfigurationOutputSchema: OutputSchema = {
  fields: [{ key: 'loggingConfig', label: 'Logging Config' }],
};

export const amazonBedrockGetPromptRouterOutputSchema: OutputSchema = {
  fields: [
    { key: 'promptRouterName', label: 'Prompt Router Name' },
    {
      key: 'routingCriteria',
      label: 'Routing Criteria',
      children: [
        {
          key: 'responseQualityDifference',
          label: 'Response Quality Difference',
          format: 'number',
        },
      ],
    },
    { key: 'promptRouterArn', label: 'Prompt Router ARN' },
    { key: 'models', label: 'Models', listItems: [{ key: 'modelArn', label: 'Model ARN' }] },
    {
      key: 'fallbackModel',
      label: 'Fallback Model',
      children: [{ key: 'modelArn', label: 'Model ARN' }],
    },
    { key: 'status', label: 'Status' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  ],
};

export const amazonBedrockGetSessionOutputSchema: OutputSchema = {
  fields: [
    { key: 'sessionId', label: 'Session ID' },
    { key: 'sessionArn', label: 'Session ARN' },
    { key: 'sessionStatus', label: 'Session Status' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'lastUpdatedAt', label: 'Last Updated At', format: 'datetime' },
    {
      key: 'sessionMetadata',
      label: 'Session Metadata',
      children: [{ key: 'stage', label: 'Stage' }, { key: 'source', label: 'Source' }],
    },
  ],
};

export const amazonBedrockGetSessionInvocationStepOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'invocationStep',
      label: 'Invocation Step',
      children: [
        { key: 'sessionId', label: 'Session ID' },
        { key: 'invocationId', label: 'Invocation ID' },
        { key: 'invocationStepId', label: 'Invocation Step ID' },
        { key: 'invocationStepTime', label: 'Invocation Step Time', format: 'datetime' },
        {
          key: 'payload',
          label: 'Payload',
          children: [
            {
              key: 'contentBlocks',
              label: 'Content Blocks',
              listItems: [{ key: 'text', label: 'Text' }],
            },
          ],
        },
      ],
    },
  ],
};

export const amazonBedrockInvokeGuardrailChecksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      children: [
        {
          key: 'contentFilter',
          label: 'Content Filter',
          children: [
            {
              key: 'results',
              label: 'Results',
              listItems: [
                { key: 'category', label: 'Category' },
                { key: 'severityScore', label: 'Severity Score', format: 'number' },
              ],
            },
          ],
        },
        {
          key: 'promptAttack',
          label: 'Prompt Attack',
          children: [
            {
              key: 'results',
              label: 'Results',
              listItems: [
                { key: 'category', label: 'Category' },
                { key: 'severityScore', label: 'Severity Score', format: 'number' },
              ],
            },
          ],
        },
        {
          key: 'sensitiveInformation',
          label: 'Sensitive Information',
          children: [
            {
              key: 'results',
              label: 'Results',
              listItems: [
                { key: 'type', label: 'Type' },
                { key: 'confidenceScore', label: 'Confidence Score', format: 'number' },
                { key: 'beginOffset', label: 'Begin Offset', format: 'number' },
                { key: 'endOffset', label: 'End Offset', format: 'number' },
                { key: 'messageIndex', label: 'Message Index', format: 'number' },
                { key: 'contentIndex', label: 'Content Index', format: 'number' },
              ],
            },
            { key: 'truncated', label: 'Truncated', format: 'boolean' },
          ],
        },
      ],
    },
    {
      key: 'usage',
      label: 'Usage',
      children: [
        {
          key: 'contentFilter',
          label: 'Content Filter',
          children: [{ key: 'textUnits', label: 'Text Units', format: 'number' }],
        },
        {
          key: 'promptAttack',
          label: 'Prompt Attack',
          children: [{ key: 'textUnits', label: 'Text Units', format: 'number' }],
        },
        {
          key: 'sensitiveInformation',
          label: 'Sensitive Information',
          children: [{ key: 'textUnits', label: 'Text Units', format: 'number' }],
        },
      ],
    },
  ],
};

export const amazonBedrockInvokeModelOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'body',
      label: 'Body',
      children: [
        { key: 'embedding', label: 'Embedding' },
        {
          key: 'embeddingsByType',
          label: 'Embeddings By Type',
          children: [{ key: 'float', label: 'Float' }],
        },
        { key: 'inputTextTokenCount', label: 'Input Text Token Count', format: 'number' },
      ],
    },
    { key: 'contentType', label: 'Content Type' },
  ],
};

export const amazonBedrockListEnforcedGuardrailConfigurationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'configurations', label: 'Configurations' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextToken', label: 'Next Token' },
  ],
};

export const amazonBedrockListFoundationModelsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'models',
      label: 'Models',
      listItems: [
        { key: 'modelArn', label: 'Model ARN' },
        { key: 'modelId', label: 'Model ID' },
        { key: 'modelName', label: 'Model Name' },
        { key: 'providerName', label: 'Provider Name' },
        { key: 'inputModalities', label: 'Input Modalities' },
        { key: 'outputModalities', label: 'Output Modalities' },
        {
          key: 'responseStreamingSupported',
          label: 'Response Streaming Supported',
          format: 'boolean',
        },
        { key: 'customizationsSupported', label: 'Customizations Supported' },
        { key: 'inferenceTypesSupported', label: 'Inference Types Supported' },
        {
          key: 'modelLifecycle',
          label: 'Model Lifecycle',
          children: [
            { key: 'status', label: 'Status' },
            { key: 'startOfLifeTime', label: 'Start Of Life Time', format: 'datetime' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const amazonBedrockListInferenceProfilesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'inferenceProfiles',
      label: 'Inference Profiles',
      listItems: [
        { key: 'inferenceProfileName', label: 'Inference Profile Name' },
        { key: 'inferenceProfileArn', label: 'Inference Profile ARN' },
        { key: 'models', label: 'Models', listItems: [{ key: 'modelArn', label: 'Model ARN' }] },
        { key: 'inferenceProfileId', label: 'Inference Profile ID' },
        { key: 'status', label: 'Status' },
        { key: 'type', label: 'Type' },
        { key: 'description', label: 'Description' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
        { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextToken', label: 'Next Token' },
  ],
};

export const amazonBedrockListPromptRoutersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'promptRouters',
      label: 'Prompt Routers',
      listItems: [
        { key: 'promptRouterName', label: 'Prompt Router Name' },
        {
          key: 'routingCriteria',
          label: 'Routing Criteria',
          children: [
            {
              key: 'responseQualityDifference',
              label: 'Response Quality Difference',
              format: 'number',
            },
          ],
        },
        { key: 'promptRouterArn', label: 'Prompt Router ARN' },
        { key: 'models', label: 'Models', listItems: [{ key: 'modelArn', label: 'Model ARN' }] },
        {
          key: 'fallbackModel',
          label: 'Fallback Model',
          children: [{ key: 'modelArn', label: 'Model ARN' }],
        },
        { key: 'status', label: 'Status' },
        { key: 'type', label: 'Type' },
        { key: 'description', label: 'Description' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
        { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextToken', label: 'Next Token' },
  ],
};

export const amazonBedrockListPromptsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'prompts',
      label: 'Prompts',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'id', label: 'ID' },
        { key: 'arn', label: 'ARN' },
        { key: 'version', label: 'Version' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
        { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
        { key: 'description', label: 'Description' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextToken', label: 'Next Token' },
  ],
};

export const amazonBedrockListSessionInvocationStepsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'invocationSteps',
      label: 'Invocation Steps',
      listItems: [
        { key: 'sessionId', label: 'Session ID' },
        { key: 'invocationId', label: 'Invocation ID' },
        { key: 'invocationStepId', label: 'Invocation Step ID' },
        { key: 'invocationStepTime', label: 'Invocation Step Time', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextToken', label: 'Next Token' },
  ],
};

export const amazonBedrockListSessionInvocationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'invocations',
      label: 'Invocations',
      listItems: [
        { key: 'sessionId', label: 'Session ID' },
        { key: 'invocationId', label: 'Invocation ID' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextToken', label: 'Next Token' },
  ],
};

export const amazonBedrockListSessionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'sessions',
      label: 'Sessions',
      listItems: [
        { key: 'sessionId', label: 'Session ID' },
        { key: 'sessionArn', label: 'Session ARN' },
        { key: 'sessionStatus', label: 'Session Status' },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
        { key: 'lastUpdatedAt', label: 'Last Updated At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextToken', label: 'Next Token' },
  ],
};

export const amazonBedrockOptimizePromptOutputSchema: OutputSchema = {
  fields: [
    { key: 'optimizedPrompt', label: 'Optimized Prompt' },
    { key: 'analysis', label: 'Analysis' },
  ],
};

export const amazonBedrockPutSessionInvocationStepOutputSchema: OutputSchema = {
  fields: [{ key: 'invocationStepId', label: 'Invocation Step ID' }],
};

export const generateEmbeddingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'embedding', label: 'Embedding' },
    { key: 'dimensions', label: 'Dimensions', format: 'number' },
    { key: 'model', label: 'Model' },
  ],
};

export const sendPromptOutputSchema: OutputSchema = {
  fields: [
    { key: 'text', label: 'Text' },
    { key: 'stopReason', label: 'Stop Reason' },
    {
      key: 'usage',
      label: 'Usage',
      children: [
        { key: 'inputTokens', label: 'Input Tokens', format: 'number' },
        { key: 'outputTokens', label: 'Output Tokens', format: 'number' },
        { key: 'totalTokens', label: 'Total Tokens', format: 'number' },
      ],
    },
    { key: 'latencyMs', label: 'Latency (ms)', format: 'number' },
  ],
};

export const generateImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'image', label: 'Image File' },
    { key: 'model', label: 'Model' },
  ],
};
