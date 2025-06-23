import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    fromObjectTypeAssociationDropdown,
    associationTypeDropdown,
    toObjectIdsDropdown,
} from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { Client } from '@hubspot/api-client';
import { AssociationSpecAssociationCategoryEnum } from '../common/types';

export const removeAssociationsAction = createAction({
    auth: hubspotAuth,
    name: 'remove-associations',
    displayName: 'Remove Associations',
    description: 'Removes associations between objects',
    props: {
        fromObjectId: Property.ShortText({
            displayName: 'From Object ID',
            description: 'The ID of the object you want to remove the association from.',
            required: true,
        }),
        fromObjectType: fromObjectTypeAssociationDropdown({
            objectType: OBJECT_TYPE.COMPANY,
            displayName: 'From Object Type',
            required: true,
            description: 'The type of the object you want to remove the association from.',
        }),
        toObjectType: fromObjectTypeAssociationDropdown({
            objectType: OBJECT_TYPE.COMPANY,
            displayName: 'To Object Type',
            required: true,
            description: "Type of the currently associated objects that you're removing the association from.",
        }),
        associationType: associationTypeDropdown,
        toObjectIds: toObjectIdsDropdown({
            objectType: OBJECT_TYPE.COMPANY,
            displayName: 'To Object IDs',
            description: 'The IDs of the currently associated objects that you\'re removing the association from.',
            required: true,
        }),
    },
    async run(context) {
        const { fromObjectId, fromObjectType, toObjectType, associationType } = context.propsValue;

        const client = new Client({ accessToken: context.auth.access_token });

        if(context.propsValue.toObjectIds === undefined) {            
            throw new Error('Please provide To Object IDs');
        }

        let toObjectIds: any[];
        if (Array.isArray(context.propsValue.toObjectIds)) {
            toObjectIds = context.propsValue.toObjectIds;
        } else {
            try {
                toObjectIds = JSON.parse(context.propsValue.toObjectIds);
            } catch {
                throw new Error(
                    `Please provide To Object IDs in a valid format. Provided : ${JSON.stringify(
                        context.propsValue.toObjectIds,
                    )}`,
                );
            }
        }

        // find the association category
        const associationLabels = await client.crm.associations.v4.schema.definitionsApi.getAll(
            fromObjectType as string,
            toObjectType as string,
        );
        const association = associationLabels.results.find(
            (associationLabel) => associationLabel.typeId === associationType,
        );
        if (!association) {
            throw new Error(
                `Association type ${associationType} not found for ${fromObjectType} to ${toObjectType}`,
            );
        }
        const associationCategory = association.category;

        const response = await client.crm.associations.v4.batchApi.archiveLabels(
            fromObjectType as string,
            toObjectType as string,
            {
                inputs: toObjectIds.map((objectId) => {
                    return {
                        _from: {
                            id: fromObjectId,
                        },
                        to: {
                            id: objectId,
                        },
                        types: [
                            {
                                associationCategory:
                                    associationCategory as unknown as AssociationSpecAssociationCategoryEnum,
                                associationTypeId: associationType,
                            },
                        ],
                    };
                }),
            },
        );

        return {success: true};
    },
});
