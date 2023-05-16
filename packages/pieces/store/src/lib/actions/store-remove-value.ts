import { createAction, Property, StoreScope } from "@activepieces/pieces-framework";

export const storageRemoveValue = createAction({
    name: 'remove_value',
    displayName: 'Remove',
    description: 'Remove a value from storage',
    props: {
        key: Property.ShortText({
            displayName: 'Key',
            required: true
        })
    },
    async run(context) {
        return await context.store.delete(context.propsValue['key'], StoreScope.PROJECT);
    }
});