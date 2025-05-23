import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';
import { hulyIoAuth } from '../../index';
import { PeopleClasses, PeopleSpaces } from '../common/constants';

export const createPerson = createAction({
    auth: hulyIoAuth,
    name: 'create_person',
    displayName: 'Create Person',
    description: 'Create a new person record',
    props: {
        _class: Property.StaticDropdown({
            displayName: 'Class',
            description: 'The class of the object to create',
            required: true,
            options: {
                options: [
                    { label: 'Person', value: PeopleClasses.Person }
                ]
            },
            defaultValue: PeopleClasses.Person
        }),
        space: Property.StaticDropdown({
            displayName: 'Space',
            description: 'The space to create the object in',
            required: true,
            options: {
                options: [
                    { label: 'People', value: PeopleSpaces.People }
                ]
            },
            defaultValue: PeopleSpaces.People
        }),
        attributes: Property.Object({
            displayName: 'Attributes',
            description: 'The attributes of the object to create (firstName, lastName, email, role, etc.)',
            required: true,
        })
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);

        try {
            const personId = await client.createDoc(
                propsValue._class,
                propsValue.space,
                propsValue.attributes
            );

            await client.disconnect();
            return { id: personId };
        } catch (error) {
            await client.disconnect();
            throw error;
        }
    },
});
