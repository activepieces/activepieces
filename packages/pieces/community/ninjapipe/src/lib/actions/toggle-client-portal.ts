import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const toggleClientPortal = createAction({
  auth: ninjapipeAuth,
  name: 'toggle_client_portal',
  classification: 'DESTRUCTIVE',
  displayName: 'Toggle Client Portal',
  description:
    'Enables or disables client portal access for a contact. Enabling generates a new portal password and returns it in the step output, where anyone who can see the run can read it.',
  audience: 'both',
  aiMetadata: {
    description:
      'Turn client portal access on (enable: true) or off (enable: false) for a NinjaPipe contact by contact ID. Disabling revokes the login. Enabling sets a fresh auto-generated password every time and returns it as generated_password, so a repeated enable rotates the password. Not idempotent.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.clientPortal,
  props: {
    contactId: ninjapipeProps.contactRequired(),
    enable: Property.Checkbox({ displayName: 'Enable Client Portal', description: 'On to enable, off to disable.', required: true, defaultValue: true }),
    email: Property.ShortText({ displayName: 'Portal Email', description: "Used only when enabling. Defaults to the contact's email.", required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const enable = p.enable === true;
    const body = await ninjapipeClient.ninjapipeRequest({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.PUT,
      path: `/client-portal-accounts/${ninjapipeClient.pathId({ value: p.contactId, field: 'Contact' })}/${enable ? 'enable' : 'disable'}`,
      body: enable ? ninjapipeFields.compact({ email: p.email, auto_generate_password: true }) : {},
      operation: enable ? 'enable client portal' : 'disable client portal',
    });
    const record = ninjapipeClient.unwrapRecord(body);
    const envelope = ninjapipeClient.isRecord(body) ? body : {};
    return {
      enabled: enable,
      ...record,
      generated_password: typeof envelope['generated_password'] === 'string' ? envelope['generated_password'] : null,
      message: typeof envelope['message'] === 'string' ? envelope['message'] : null,
    };
  },
});
