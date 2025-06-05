import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { crispAuth } from '../../index';

interface CrispAuth {
  identifier: string;
  key: string;
}

export const findUserProfile = createAction({
  auth: crispAuth,
  name: 'findUserProfile',
  displayName: 'Find User Profile',
  description: 'Get detailed information about a user profile',
  props: {
    website_id: Property.ShortText({
      displayName: 'Website ID',
      description: 'The website identifier',
      required: true,
    }),
    people_id: Property.ShortText({
      displayName: 'People ID or Email',
      description: 'The people identifier or email address',
      required: true,
    }),
  },
  async run(context) {
    const { website_id, people_id } = context.propsValue;
    const auth = context.auth as CrispAuth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.crisp.chat/v1/website/${website_id}/people/profile/${people_id}`,
      headers: {
        'X-Crisp-Tier': 'plugin',
        'Authorization': `Basic ${Buffer.from(
          `${auth.identifier}:${auth.key}`
        ).toString('base64')}`,
      },
    });

    if (response.body.error) {
      throw new Error(response.body.reason || 'Failed to find user profile');
    }

    const profile = response.body.data;
    return {
      people_id: profile.people_id,
      email: profile.email,
      person: {
        nickname: profile.person?.nickname,
        avatar: profile.person?.avatar,
        gender: profile.person?.gender,
        phone: profile.person?.phone,
        address: profile.person?.address,
        description: profile.person?.description,
        website: profile.person?.website,
        timezone: profile.person?.timezone,
        profiles: profile.person?.profiles,
        employment: profile.person?.employment,
        geolocation: profile.person?.geolocation,
        locales: profile.person?.locales,
      },
      company: {
        name: profile.company?.name,
        legal_name: profile.company?.legal_name,
        domain: profile.company?.domain,
        url: profile.company?.url,
        description: profile.company?.description,
        timezone: profile.company?.timezone,
        phones: profile.company?.phones,
        emails: profile.company?.emails,
        geolocation: profile.company?.geolocation,
        metrics: {
          employees: profile.company?.metrics?.employees,
          market_cap: profile.company?.metrics?.market_cap,
          raised: profile.company?.metrics?.raised,
          arr: profile.company?.metrics?.arr,
        },
        tags: profile.company?.tags,
      },
      segments: profile.segments,
      notepad: profile.notepad,
      active: {
        now: profile.active?.now,
        last: profile.active?.last,
      },
      score: profile.score,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  },
});
