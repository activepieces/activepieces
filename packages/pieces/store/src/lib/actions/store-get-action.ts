import { createAction, Property, StoreScope } from "@activepieces/pieces-framework";


export const storageGetAction = createAction({
    name: 'get',
    displayName: 'Get',
    description: 'Get a value from storage',
    props: {
        key: Property.ShortText({
            displayName: 'Key',
            required: true
        }),
        defaultValue: Property.ShortText({
            displayName: 'Default Value',
            required: false
        })
    },
    async run(context) {
        return await context.store.get(context.propsValue['key'], StoreScope.COLLECTION) ?? context.propsValue['defaultValue'];
    }
});
