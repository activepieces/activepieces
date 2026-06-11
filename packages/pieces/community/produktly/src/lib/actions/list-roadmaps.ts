import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';

export const listRoadmaps = createAction({
  auth: produktlyAuth,
  name: 'list_roadmaps',
  displayName: 'List Roadmaps',
  description: 'List all public roadmaps in your Produktly account.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of roadmaps to return (1-100, default 50).',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of roadmaps to skip for pagination (default 0).',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await produktlyApiCall<{
      data: Array<{
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
      }>;
    }>({
      auth,
      method: HttpMethod.GET,
      path: '/roadmaps',
      queryParams: {
        limit: String(propsValue.limit ?? 50),
        offset: String(propsValue.offset ?? 0),
      },
    });
    return response.body.data.map((roadmap) => ({
      roadmap_id: roadmap.id,
      roadmap_name: roadmap.name,
      roadmap_public_name: roadmap.publicName,
      roadmap_active: roadmap.active,
      roadmap_custom_domain: roadmap.customDomain,
      roadmap_public_id: roadmap.publicId,
      roadmap_section_count: roadmap.sections.length,
      roadmap_item_count: roadmap.sections.reduce((acc, s) => acc + s.items.length, 0),
    }));
  },
});
