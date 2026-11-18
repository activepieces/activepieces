import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const getSiteInfoAction = createAction({
  auth: discourseAuth,
  name: 'get_site_info',
  classification: 'READ',
  displayName: 'Get Site Info',
  description: 'Returns basic information about the Discourse forum.',
  audience: 'ai',
  aiMetadata: {
    description: 'Get basic facts about the connected Discourse forum: title, description, logos, locale and whether login is required. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: discourseSchemas.siteInfo,
  async run({ auth }) {
    const body = discourseMap.rec(
      await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: '/site/basic-info.json' }),
    );
    return {
      title: discourseMap.str(body['title']),
      description: discourseMap.str(body['description']),
      logo_url: discourseMap.str(body['logo_url']),
      mobile_logo_url: discourseMap.str(body['mobile_logo_url']),
      default_locale: discourseMap.str(body['default_locale']),
      login_required: discourseMap.bool(body['login_required']),
      locale: discourseMap.str(body['locale']),
      include_in_discourse_discover: discourseMap.bool(body['include_in_discourse_discover']),
      url: discourseOps.baseUrl(auth.props),
    };
  },
});
