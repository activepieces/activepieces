import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const saveQueueGroupAction = createAction({
  auth: simplyprintAuth,
  name: 'save_queue_group',
  displayName: 'Save Queue Group',
  description:
    'Create or update a queue group. Pass an existing group ID to edit it; omit it to create a new one. Requires the Queue Groups feature on the account.',
  props: {
    groupId: Property.Number({
      displayName: 'Group ID (edit existing)',
      description: 'Numeric ID of the group to edit. Omit to create a new group.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Group name',
      description: 'Display name for the group (max 64 chars).',
      required: true,
    }),
    acceptedExtensions: Property.Array({
      displayName: 'Accepted file extensions',
      description: 'File extensions allowed in this group (without the dot, e.g. `gcode`, `bgcode`). Leave empty for "any".',
      required: false,
    }),
    virtualOnly: Property.Checkbox({
      displayName: 'Virtual only',
      description: 'When true, no real queue items can be added — used for placeholder/grouping-only groups.',
      required: true,
      defaultValue: false,
    }),
    forPrinters: Property.Array({
      displayName: 'For printers (IDs)',
      description: 'Optional. Restrict this group to specific printers.',
      required: false,
    }),
    forModels: Property.Array({
      displayName: 'For printer models (IDs)',
      description: 'Optional. Restrict this group to specific printer models.',
      required: false,
    }),
    forGroups: Property.Array({
      displayName: 'For printer groups (IDs)',
      description: 'Optional. Restrict this group to specific printer groups.',
      required: false,
    }),
    visibilityUserRanks: Property.Array({
      displayName: 'Visibility user rank IDs',
      description: 'Optional. Limit who can see the group based on user rank IDs.',
      required: false,
    }),
    approvalRequiredRanks: Property.Array({
      displayName: 'Approval-required user rank IDs',
      description: 'Optional. User ranks whose submissions need approval.',
      required: false,
    }),
    approvalExemptRanks: Property.Array({
      displayName: 'Approval-exempt user rank IDs',
      description: 'Optional. User ranks whose submissions skip approval.',
      required: false,
    }),
    requiresApproval: Property.Checkbox({
      displayName: 'Requires approval',
      description: 'Master toggle for approval workflow on this group.',
      required: false,
    }),
  },
  async run(context) {
    const v = context.propsValue;
    const csv = (a: unknown) => (a as unknown[] | undefined ?? []).map(Number).filter((n) => n > 0).join(',');

    const body: Record<string, unknown> = {
      name: v.name,
      virtual_only: v.virtualOnly ?? false,
    };
    if (typeof v.groupId === 'number' && v.groupId > 0) body['id'] = v.groupId;
    body['accepted_extensions'] = (v.acceptedExtensions as string[] | undefined) ?? null;

    const fp = csv(v.forPrinters);
    if (fp) body['for_printers'] = fp;
    const fm = csv(v.forModels);
    if (fm) body['for_models'] = fm;
    const fg = csv(v.forGroups);
    if (fg) body['for_groups'] = fg;
    const vr = csv(v.visibilityUserRanks);
    if (vr) body['visibility_user_ranks'] = vr;
    const ar = csv(v.approvalRequiredRanks);
    if (ar) body['approval_required_ranks'] = ar;
    const ae = csv(v.approvalExemptRanks);
    if (ae) body['approval_exempt_ranks'] = ae;
    if (typeof v.requiresApproval === 'boolean') body['requires_approval'] = v.requiresApproval;

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/groups/Save',
      body,
    });
  },
});
