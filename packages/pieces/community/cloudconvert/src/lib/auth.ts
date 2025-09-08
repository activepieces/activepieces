import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const cloudConvertAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Create an API key in your CloudConvert dashboard, then paste it here. It will be used as a Bearer token.',
  required: true,
});

export const cloudConvertCommonProps = {
  waitForCompletion: Property.Checkbox({
    displayName: 'Wait for Job Completion',
    description:
      'If enabled, the action will wait until the CloudConvert job finishes and return output URLs. Otherwise, it returns the job immediately.',
    required: true,
    defaultValue: true,
  }),
  endpointOverride: Property.ShortText({
    displayName: 'Endpoint Override (optional)',
    description:
      'Override the base API URL if needed (default: https://api.cloudconvert.com/v2).',
    required: false,
  }),
};