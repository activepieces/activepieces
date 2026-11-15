import { createAction } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudApi } from '../common/client';
import { jumpcloudObjects } from '../common/objects';
import { jumpcloudOutput } from '../common/output';
import { jumpcloudProps } from '../common/props';

export const listObjectsAction = createAction({
    auth: jumpcloudAuth,
    name: 'list_objects',
    classification: 'SEARCH',
    displayName: 'List Objects (Batch)',
    description: 'List users, devices, groups or applications, one page at a time or all pages at once.',
    audience: 'both',
    aiMetadata: {
        description:
            'Lists JumpCloud objects of one type (users, systems/devices, user groups, device groups or SSO applications) in a stable order, with paging. Returns items plus total_count and next_skip; pass next_skip back as Skip to continue. Use Search Objects to filter by name or field. Safe to retry.',
        idempotent: true,
    },
    props: {
        objectType: jumpcloudProps.objectType(),
        ...jumpcloudProps.pagination(),
    },
    async run(context) {
        const auth = context.auth.props;
        const { limit, skip, fetchAll, maxItems } = context.propsValue;
        const type = jumpcloudObjects.parseType(context.propsValue.objectType);
        const result = await jumpcloudApi.collectPages({
            fetchPage: (page) => jumpcloudObjects.listPage({ auth, type, page }),
            limit,
            skip,
            fetchAll,
            maxItems,
        });
        return { ...result, items: result.items.map((record) => jumpcloudOutput.flatten({ type, record })) };
    },
});
