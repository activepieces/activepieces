import { createAction } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudAssociations } from '../common/associations';
import { jumpcloudProps } from '../common/props';
import { associationOutputSchema } from '../output-schemas';

export const deleteAssociationAction = createAction({
    auth: jumpcloudAuth,
    name: 'delete_association',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete Association',
    description: "Unlink two JumpCloud objects, such as removing a user from a group or revoking a user group's access to an application or device.",
    audience: 'both',
    aiMetadata: {
        description:
            'Removes the association between two JumpCloud objects: group membership, or access between users/user groups and devices, device groups and SSO applications. Access is revoked at the next agent check-in or sign-in. Not safe to retry blindly: a second call may fail because the association is already gone.',
        idempotent: false,
    },
    props: {
        objectType: jumpcloudProps.objectType({ description: 'The kind of the first object.' }),
        objectId: jumpcloudProps.objectId({ displayName: 'Object' }),
        targetType: jumpcloudProps.objectType({ displayName: 'Remove Association With', description: 'The kind of object to unlink it from.' }),
        targetId: jumpcloudProps.objectId({ displayName: 'Associated Object', typeProp: 'targetType' }),
    },
    outputSchema: associationOutputSchema,
    async run(context) {
        const ends = jumpcloudAssociations.parseEnds(context.propsValue);
        await jumpcloudAssociations.change({ auth: context.auth.props, op: 'remove', ends });
        return jumpcloudAssociations.toOutput({ ends, associated: false });
    },
});
