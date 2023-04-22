import {createAction, Property, StoreScope} from "@activepieces/pieces-framework";


export const storageAddtoList = createAction({
    name: 'add_to_list',
    displayName: 'Add To List',
    description: 'Add Item to a list',
    props: {
        key: Property.ShortText({
            displayName: 'Key',
            required: true
        }),
        value: Property.ShortText({
            displayName: 'Value',
            required: true
        }),
        ignore_if_exists: Property.Checkbox({
            displayName: 'Ignore if value exists',
            required: false
        })
    },
    async run(context) {
        const items = (await context.store.get<unknown[]>(context.propsValue['key'], StoreScope.COLLECTION)) ?? [];
        if (!Array.isArray(items)) {
            throw new Error(`Key ${context.propsValue['key']} is not an array`);
        }
        if(context.propsValue['ignore_if_exists'] && items.includes(context.propsValue['value'])) {
            return items;
        }
        items.push(context.propsValue['value']);
        return await context.store.put(context.propsValue['key'], items, StoreScope.COLLECTION);
    }
});
