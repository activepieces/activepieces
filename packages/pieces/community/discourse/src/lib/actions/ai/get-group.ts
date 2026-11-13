import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const getGroupAction = createAction({
  auth: discourseAuth,
  name: 'get_group',
  classification: 'READ',
  displayName: 'Get Group',
  description: 'Returns a Discourse group by name.',
  audience: 'ai',
  aiMetadata: {
    description: 'Get one Discourse group by its name (not the display name), including its numeric ID, member count and settings. Read-only.',
    idempotent: true,
  },
  props: {
    group_name: Property.ShortText({ displayName: 'Group Name', required: true }),
  },
  outputSchema: discourseSchemas.group,
  async run({ auth, propsValue }) {
    const name = discourseInput.name({ value: propsValue.group_name, label: 'Group Name' });
    const body = discourseMap.rec(await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/groups/${name}.json` }));
    return discourseMap.group({ raw: body['group'] });
  },
});
