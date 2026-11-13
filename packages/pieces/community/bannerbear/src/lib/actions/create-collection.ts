import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bannerbearAuth } from '../auth';
import { bannerbearClient, RawImage } from '../common/client';
import { bannerbearProps } from '../common/props';
import { bannerbearOutputSchemas } from '../output-schemas';

export const createCollectionAction = createAction({
  auth: bannerbearAuth,
  name: 'create_collection',
  classification: 'WRITE',
  displayName: 'Create Collection',
  description: 'Render every template in a template set (V2 API keys only).',
  audience: 'both',
  aiMetadata: {
    description:
      'Render one image per template in a Bannerbear template set, applying the same layer modifications to all. Only works with V2 API keys. Each call starts new renders and uses one credit per template.',
    idempotent: false,
  },
  outputSchema: bannerbearOutputSchemas['collection'],
  props: {
    template_set: bannerbearProps.templateSet,
    modifications: Property.Json({
      displayName: 'Layer Modifications',
      description: 'JSON array, one object per layer, each with "name".',
      required: true,
      defaultValue: [{ name: 'title', text: 'Hello world' }],
    }),
    metadata: Property.ShortText({
      displayName: 'Metadata',
      description: 'Any text to store with the collection.',
      required: false,
    }),
    wait_for_completion: bannerbearProps.waitForCompletion,
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    bannerbearClient.requireVersion({ apiKey, version: 'v2', feature: 'Create Collection' });
    const templateSet = String(propsValue.template_set ?? '').trim();
    if (templateSet === '') throw new Error('Template Set is required.');
    const body: Record<string, unknown> = {
      template_set: templateSet,
      modifications: bannerbearClient.parseModificationsJson(propsValue.modifications),
    };
    if (propsValue.metadata) body['metadata'] = propsValue.metadata;
    const created = await bannerbearClient.request<RawCollection>({
      apiKey,
      method: HttpMethod.POST,
      path: '/collections',
      body,
    });
    const { record, timedOut } = await bannerbearClient.waitFor({
      initial: created,
      wait: propsValue.wait_for_completion !== false,
      doneStatuses: bannerbearClient.IMAGE_DONE_STATUSES,
      failedStatuses: bannerbearClient.IMAGE_FAILED_STATUSES,
      fetchLatest: () =>
        bannerbearClient.request<RawCollection>({
          apiKey,
          method: HttpMethod.GET,
          path: `/collections/${encodeURIComponent(created.uid)}`,
        }),
    });
    bannerbearClient.throwIfFailed({ status: record.status, uid: record.uid });
    return {
      uid: record.uid,
      status: record.status ?? null,
      template_set: record.template_set ?? templateSet,
      images: (record.images ?? []).map((image) => {
        const n = bannerbearClient.normalizeImage(image);
        return {
          uid: n.uid,
          status: n.status,
          template_uid: n.template_uid,
          image_url: n.image_url,
        };
      }),
      metadata: record.metadata ?? null,
      self: record.self ?? null,
      created_at: record.created_at ?? null,
      timed_out: timedOut,
    };
  },
});

type RawCollection = {
  uid: string;
  status?: string | null;
  template_set?: string | null;
  images?: RawImage[];
  metadata?: string | null;
  self?: string | null;
  created_at?: string | null;
};
