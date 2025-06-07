import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';
import { hulyIoAuth } from '../../index';
import { PeopleClasses } from '../common/constants';

export const findPerson = createAction({
    auth: hulyIoAuth,
    name: 'find_person',
    displayName: 'Find Person',
    description: 'Retrieves multiple person matching the query criteria',
    props: {
        _class: Property.StaticDropdown({
            displayName: 'Class',
            description: 'Class of the object to find, results will include all subclasses of the target class',
            required: true,
            options: {
                options: Object.entries(PeopleClasses).map(([key, value]) => ({
                    label: key,
                    value: value
                }))
            },
            defaultValue: PeopleClasses.Person
        }),
        query: Property.Object({
            displayName: 'Query',
            description: 'Query criteria',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Limit the number of results returned',
            required: false,
            defaultValue: 10,
        }),
        sort: Property.Object({
            displayName: 'Sort',
            description: 'Sorting criteria',
            required: false,
        }),
        lookup: Property.Object({
            displayName: 'Lookup',
            description: 'Lookup criteria',
            required: false,
        }),
        projection: Property.Object({
            displayName: 'Projection',
            description: 'Projection criteria',
            required: false,
        }),
        total: Property.Checkbox({
            displayName: 'Return Total',
            description: 'If specified total will be returned',
            required: false,
            defaultValue: false,
        }),
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);
        try {
            const options = {
                limit: propsValue.limit,
                sort: propsValue.sort,
                lookup: propsValue.lookup,
                projection: propsValue.projection,
                total: propsValue.total
            };

            const persons = await client.findAll(
                propsValue._class,
                propsValue.query || {},
                options
            );

            await client.disconnect();
            return persons || [];
        } catch (error) {
            await client.disconnect();
            throw error;
        }
    },
});
