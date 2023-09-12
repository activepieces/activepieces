import { Property, createAction } from "@activepieces/pieces-framework";

export const split = createAction({
    description: "Split a string by a delimeter",
    displayName: "Split",
    name: "split",
    props: {
        string: Property.ShortText({
            displayName: "String",
            required: true,
        }),
        delimeter: Property.ShortText({
            displayName: "Delimeter",
            required: true,
        }),
    },
    run: async (ctx) => {
        return ctx.propsValue.string.split(ctx.propsValue.delimeter);
    },
});
