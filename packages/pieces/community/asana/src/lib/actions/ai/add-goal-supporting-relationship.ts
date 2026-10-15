import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';

export const asanaAddGoalSupportingRelationshipAction = createAction({
  auth: asanaAuth,
  name: 'add_goal_supporting_relationship',
  classification: 'WRITE',
  displayName: 'Add Goal Supporting Relationship',
  description: 'Link a subgoal, project, task or portfolio as supporting an Asana goal (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Links a goal, project, task or portfolio as supporting a parent goal and returns the new goal relationship (gid, type, contribution weight). Contribution Weight (0 to 1, default 0) sets how much the supporter\'s progress counts toward an automatically calculated parent goal; it must be above 0 to count. Check List Goal Relationships first so the same resource is not linked twice. Goals need an Advanced or higher Asana plan. Not idempotent: it creates a relationship record, and Asana does not document what a repeat does.',
    idempotent: false,
  },
  props: {
    goal: Property.ShortText({
      displayName: 'Parent Goal GID',
      description: 'Gid of the goal being supported. Obtain it from List Goals.',
      required: true,
    }),
    supporting_resource: Property.ShortText({
      displayName: 'Supporting Resource GID',
      description: 'Gid of the goal, project, task or portfolio that supports the parent goal.',
      required: true,
    }),
    contribution_weight: Property.Number({
      displayName: 'Contribution Weight',
      description: 'Share of the supporter\'s progress that counts toward the parent goal, from 0 to 1, for example 0.25. Leave empty for 0.',
      required: false,
    }),
    insert_before: Property.ShortText({
      displayName: 'Insert Before Subgoal GID',
      description: 'For a subgoal: gid of an existing subgoal to place it before. Do not combine with Insert After.',
      required: false,
    }),
    insert_after: Property.ShortText({
      displayName: 'Insert After Subgoal GID',
      description: 'For a subgoal: gid of an existing subgoal to place it after. Do not combine with Insert Before.',
      required: false,
    }),
  },
  async run(context) {
    const { goal, supporting_resource, contribution_weight, insert_before, insert_after } = context.propsValue;
    asanaUtils.assertNotBoth({ first: insert_before, second: insert_after, firstLabel: 'Insert Before Subgoal GID', secondLabel: 'Insert After Subgoal GID' });
    if (asanaUtils.hasValue(contribution_weight) && (typeof contribution_weight !== 'number' || contribution_weight < 0 || contribution_weight > 1)) {
      throw new Error(`Contribution Weight must be a number from 0 to 1, got ${contribution_weight}.`);
    }
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/goals/${asanaUtils.pathSegment(goal)}/addSupportingRelationship`,
      operation: 'Add Goal Supporting Relationship',
      query: { opt_fields: ASANA_FIELDS.goalRelationship },
      data: {
        supporting_resource: supporting_resource.trim(),
        ...(typeof contribution_weight === 'number' ? { contribution_weight } : {}),
        ...(asanaUtils.hasValue(insert_before) ? { insert_before: String(insert_before).trim() } : {}),
        ...(asanaUtils.hasValue(insert_after) ? { insert_after: String(insert_after).trim() } : {}),
      },
    });
  },
});
