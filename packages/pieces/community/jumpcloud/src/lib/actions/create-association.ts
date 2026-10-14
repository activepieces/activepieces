import { createAction } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { jumpcloudAssociations } from '../common/associations';
import { jumpcloudProps } from '../common/props';
import { associationOutputSchema } from '../output-schemas';

export const createAssociationAction = createAction({
    auth: jumpcloudAuth,
    name: 'create_association',
    classification: 'WRITE',
    displayName: 'Create Association',
    description: 'Link two JumpCloud objects, such as adding a user to a group or giving a user group access to an application or device.',
    audience: 'both',
    aiMetadata: {
        description:
            'Associates two JumpCloud objects: user group or device group membership, or access between users/user groups and devices, device groups and SSO applications. Errors when the pair cannot be associated and lists the valid targets. Re-adding an existing association may fail with a conflict, so check before retrying.',
        idempotent: false,
    },
    props: {
        objectType: jumpcloudProps.objectType({ description: 'The kind of the first object.' }),
        objectId: jumpcloudProps.objectId({ displayName: 'Object' }),
        targetType: jumpcloudProps.objectType({ displayName: 'Associate With', description: 'The kind of object to link it to.' }),
        targetId: jumpcloudProps.objectId({ displayName: 'Associated Object', typeProp: 'targetType' }),
    },
    outputSchema: associationOutputSchema,
    async run(context) {
        const ends = jumpcloudAssociations.parseEnds(context.propsValue);
        await jumpcloudAssociations.change({ auth: context.auth.props, op: 'add', ends });
        return jumpcloudAssociations.toOutput({ ends, associated: true });
    },
});
