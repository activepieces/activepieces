import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { cognitoRequest, isRecord } from '../common/client';
import { formPath, readString } from '../common/entries';
import { formIdInput } from '../common/props';
import { availabilityOutputSchema } from '../output-schemas';

export const setFormAvailabilityAction = createAction({
  auth: cognitoFormsAuth,
  name: 'set_form_availability',
  classification: 'WRITE',
  displayName: 'Set Form Availability',
  description: 'Opens or closes a form\'s public link for a date range. Leave both dates empty to make the form always available.',
  audience: 'both',
  aiMetadata: {
    description: 'Sets when a Cognito Forms form\'s public link accepts entries: an optional start and end date-time plus the message shown outside that window. Omitting both dates makes the form available all the time. Replaces the previous availability settings. Idempotent.',
    idempotent: true,
  },
  outputSchema: availabilityOutputSchema,
  props: {
    form_id: formIdInput,
    availabilityInfo: Property.MarkDown({
      value: 'Leave both dates empty to make the form always open. Each run replaces the current settings.',
      variant: MarkdownVariant.INFO,
    }),
    start: Property.DateTime({
      displayName: 'Available From',
      description: 'Empty: no limit.',
      required: false,
      width: 'half',
    }),
    end: Property.DateTime({
      displayName: 'Available Until',
      description: 'Empty: no limit.',
      required: false,
      width: 'half',
    }),
    message: Property.LongText({
      displayName: 'Not Available Message',
      description: 'Shown to people who open the form outside the availability window.',
      required: false,
    }),
  },
  propertyGroups: [
    { key: 'form', display: 'section', label: 'Form to change', icon: 'file', props: ['form_id'] },
    { key: 'availability', display: 'section', label: 'Availability', icon: 'calendar', props: ['availabilityInfo', 'start', 'end', 'message'] },
  ],
  async run(context) {
    const { form_id, start, end, message } = context.propsValue;
    if (start && end && new Date(start).getTime() > new Date(end).getTime()) {
      throw new Error('"Available From" must be before "Available Until".');
    }
    const body: Record<string, string> = {};
    if (start) body['start'] = start;
    if (end) body['end'] = end;
    if (message) body['message'] = message;
    const response = await cognitoRequest<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `${formPath(form_id)}/public-link-availability`,
      body,
    });
    const result = isRecord(response) ? response : {};
    return {
      form_id,
      availability_start: readString(result['AvailabilityStart'] ?? result['availabilityStart']) ?? null,
      availability_end: readString(result['AvailabilityEnd'] ?? result['availabilityEnd']) ?? null,
      not_available_message: readString(result['NotAvailableMessage'] ?? result['notAvailableMessage']) ?? null,
    };
  },
});
