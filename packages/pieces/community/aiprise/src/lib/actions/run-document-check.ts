import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const runDocumentCheckAction = createAction({
  auth: aipriseAuth,
  name: 'run_document_check',
  displayName: 'Run Business Document Check',
  description:
    'Runs a verification check on a document belonging to an existing business profile. AiPrise will process the uploaded file against the checks defined in the chosen template.',
  props: {
    business_profile_id: Property.ShortText({
      displayName: 'Business Profile ID',
      description:
        'The ID of the business profile the document belongs to. You can find this in AiPrise → **Businesses** → open the business → copy the **Profile ID**.',
      required: true,
    }),
    template_id: Property.ShortText({
      displayName: 'Verification Template',
      description:
        'Which set of checks to run. To find this: log in to AiPrise → go to **Templates** → open the template you want → copy the **Template ID** shown at the top of the page.',
      required: true,
    }),
    file_uuid: Property.ShortText({
      displayName: 'File UUID',
      description:
        'The UUID of the document file that was previously uploaded to AiPrise.',
      required: true,
    }),
    document_input_title: Property.ShortText({
      displayName: 'Document Input Title',
      description:
        'An optional unique identifier for this document input. This value is included in webhook payloads and API responses so you can distinguish between multiple documents.',
      required: false,
    }),
    client_reference_id: Property.ShortText({
      displayName: 'Client Reference ID',
      description:
        'Your own identifier to associate with this request — for example an order number or internal case ID.',
      required: false,
    }),
    client_reference_data: Property.Json({
      displayName: 'Client Reference Data',
      description: 'Any additional JSON data you want to store alongside this request.',
      required: false,
    }),
  },
  async run(context) {
    const {
      business_profile_id,
      template_id,
      file_uuid,
      document_input_title,
      client_reference_id,
      client_reference_data,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      business_profile_id,
      template_id,
      file_uuid,
    };

    if (document_input_title) body['document_input_title'] = document_input_title;
    if (client_reference_id) body['client_reference_id'] = client_reference_id;
    if (client_reference_data) body['client_reference_data'] = client_reference_data;

    return aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/verify/run_check_on_business_document',
      body,
    });
  },
});
