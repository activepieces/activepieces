import {createAction, Property, StoreScope} from "@activepieces/pieces-framework";

export const storagePutAction = createAction({
    name: 'put',
    displayName: 'Put',
    description: 'Put a value in storage',
    props: {
        key: Property.ShortText({
            displayName: 'Key',
            required: true
        }),
        value: Property.ShortText({
            displayName: 'Value',
            required: true
        }),
    },
    async run(context) {
        return await context.store.put(context.propsValue['key'], context.propsValue['value'], StoreScope.PROJECT);
    }
});