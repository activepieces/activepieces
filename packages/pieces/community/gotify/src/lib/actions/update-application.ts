import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gotifyAuth } from '../auth';
import { gotifyClient } from '../common/client';
import { gotifyOutputSchemas } from '../common/output-schemas';

export const updateApplication = createAction({
  auth: gotifyAuth,
  name: 'update_application',
  classification: 'WRITE',
  displayName: 'Update Application',
  description:
    'Change the name, description or default priority of an application. Gotify replaces all three fields on every update, so fields you leave empty are re-sent with the values read just before the update; do not run two updates of the same application at the same time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a Gotify application by numeric id: only the fields you pass change (name, description, defaultPriority 0-10); set clearDescription=true to blank the description. Omitted fields keep their current value: Gotify has no partial update or version check, so the action reads the application and re-sends all three fields; concurrent updates of the same application can overwrite each other, so run them one at a time. Needs the Client Token. Idempotent: the same input gives the same end state. Returns the application without its token.',
    idempotent: true,
  },
  outputSchema: gotifyOutputSchemas.application,
  props: {
    applicationId: Property.ShortText({ displayName: 'Application ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
    clearDescription: Property.Checkbox({ displayName: 'Clear Description', required: false, defaultValue: false }),
    defaultPriority: Property.Number({ displayName: 'Default Priority', description: '0-10', required: false }),
  },
  async run({ auth, propsValue }) {
    const id = gotifyClient.parseId({ value: propsValue.applicationId, label: 'Application ID' });
    const name = gotifyClient.optionalText(propsValue.name);
    const description = gotifyClient.optionalText(propsValue.description);
    const defaultPriority = gotifyClient.parseOptionalInt({ value: propsValue.defaultPriority, label: 'Default Priority', min: 0, max: 10 });
    const clearDescription = propsValue.clearDescription === true;
    if (clearDescription && description !== undefined) {
      throw new Error('Use either Description or Clear Description, not both.');
    }
    if (name === undefined && description === undefined && defaultPriority === undefined && !clearDescription) {
      throw new Error('Give at least one field to change.');
    }
    const apps = await gotifyClient.request({ auth: auth.props, method: HttpMethod.GET, path: '/application', tokenKind: 'client' });
    const current = gotifyClient.arrayOf(apps).find((app) => gotifyClient.isRecord(app) && app['id'] === id);
    if (!gotifyClient.isRecord(current)) {
      throw new Error(`Application ${id} was not found for this Gotify user.`);
    }
    const updated = await gotifyClient.request({
      auth: auth.props,
      method: HttpMethod.PUT,
      path: `/application/${id}`,
      tokenKind: 'client',
      body: {
        name: name ?? current['name'],
        description: clearDescription ? '' : description ?? current['description'] ?? '',
        defaultPriority: defaultPriority ?? current['defaultPriority'] ?? 0,
      },
    });
    return gotifyClient.withoutToken(updated);
  },
});
