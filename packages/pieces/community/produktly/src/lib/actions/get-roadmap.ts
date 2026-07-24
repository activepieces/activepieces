import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';
import { produktlyProps } from '../common/props';

export const getRoadmap = createAction({
  auth: produktlyAuth,
  name: 'get_roadmap',
  displayName: 'Get Roadmap',
  description: 'Get a single roadmap with its sections, items, tags and vote counts.',
  props: {
    roadmap: produktlyProps.roadmap,
  },
  async run({ auth, propsValue }) {
    const response = await produktlyApiCall<{
      id: number;
      name: string;
      publicName: string;
      active: boolean;
      customDomain: string;
      publicId: string;
      sections: Array<{
        id: number;
        name: string;
        items: Array<{
          id: number;
          name: string;
          description: string;
          votesCount: number;
          updatedAt: string;
          tag: { id: number; name: string; backgroundColor: string; textColor: string } | null;
        }>;
      }>;
    }>({
      auth,
      method: HttpMethod.GET,
      path: `/roadmaps/${propsValue.roadmap}`,
    });
    const items: Array<Record<string, unknown>> = [];
    for (const section of response.body.sections) {
      for (const item of section.items) {
        items.push({
          roadmap_id: response.body.id,
          section_id: section.id,
          section_name: section.name,
          item_id: item.id,
          item_name: item.name,
          item_description: item.description,
          item_votes: item.votesCount,
          item_updated_at: item.updatedAt,
          item_tag: item.tag?.name ?? null,
        });
      }
    }
    return {
      roadmap_id: response.body.id,
      roadmap_name: response.body.name,
      roadmap_public_name: response.body.publicName,
      roadmap_active: response.body.active,
      roadmap_custom_domain: response.body.customDomain,
      roadmap_public_id: response.body.publicId,
      section_count: response.body.sections.length,
      item_count: items.length,
      items,
    };
  },
});
