import {createAction, Property, StoreScope} from "@activepieces/framework";


export const storageGetAction = createAction({
    name: 'get',
    displayName: 'Get',
    description: 'Get a value from storage',
    props: {
        key: Property.ShortText({
            displayName: 'Key',
            required: true
        }),
    },
    async run(context) {
        return await context.store.get(context.propsValue['key']!, StoreScope.COLLECTION);
    }
});