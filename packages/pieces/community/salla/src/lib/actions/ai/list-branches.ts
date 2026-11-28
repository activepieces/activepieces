import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaUtils } from '../../common/helpers';
import { sallaAuth } from '../../auth';
import { sallaApi } from '../../common/client';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiListBranchesAction = createAction({
  auth: sallaAuth,
  name: 'ai_list_branches',
  classification: 'SEARCH',
  displayName: 'List Branches',
  description: 'Lists the store branches and warehouses.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Salla store\'s branches and warehouses with id, name, type, status, default flag and whether pickup, shipping and cash on delivery are available. Call it to get the branch_id that Create Order and Update Order need and the branch IDs that List Orders filters by. Returns up to 200 branches and truncated=true when more exist.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.branchList,
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Optional text to match in the branch name, for example Riyadh. Leave empty to list all branches.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const keyword = propsValue.keyword?.trim();
    const { items, truncated } = await sallaApi.fetchPaged<unknown>({
      auth,
      path: '/branches',
      query: { keyword: keyword && keyword.length > 0 ? keyword : undefined },
      maxItems: MAX_ITEMS,
    });
    const branches = items.filter(sallaApi.isRecord).map((record) => sallaUtils.withKeys({ record, keys: BRANCH_KEYS }));
    return { branches, count: branches.length, truncated };
  },
});


const MAX_ITEMS = 200;
const BRANCH_KEYS = [
  'id',
  'name',
  'type',
  'status',
  'is_default',
  'branch_code',
  'is_cod_available',
  'pickable',
  'shippable',
  'is_open',
];
