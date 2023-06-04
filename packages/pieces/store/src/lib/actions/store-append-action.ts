import {createAction, Property, StoreScope} from "@activepieces/pieces-framework";

export const storageAppendAction = createAction({
    name: 'append',
    displayName: 'Append',
    description: 'Append to a value in storage',
    props: {
        key: Property.ShortText({
            displayName: 'Key',
            required: true
        }),
        value: Property.ShortText({
            displayName: 'Value',
            required: true
        }),
        separator: Property.ShortText({
            displayName: 'Separator',
            description: 'Separator between added values, use \\n for newlines',
            required: false
        })
    },
    async run(context) {
        const oldValue = (await context.store.get(context.propsValue.key, StoreScope.PROJECT)) || ''
        if (typeof oldValue !== 'string') {
            throw new Error(`Key ${context.propsValue.key} is not a string`);
        }
        const appendValue = context.propsValue.value
        let separator = context.propsValue.separator || ''
        separator = separator.replace(/\\n/g, '\n') // Allow newline escape sequence
        const newValue = oldValue + (oldValue.length > 0 ? separator : '') + appendValue
        return await context.store.put(context.propsValue.key, newValue, StoreScope.PROJECT);
    }
});