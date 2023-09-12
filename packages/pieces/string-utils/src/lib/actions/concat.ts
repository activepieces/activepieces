import { Property, createAction } from "@activepieces/pieces-framework";

export const concat = createAction({
    description: "Concatenate two or more strings",
    displayName: "Concatenate",
    name: "concat",
    props: {
        strings: Property.Array({
            displayName: "Strings",
            required: true,
        }),
    },
    run: async (ctx) => {
        return ctx.propsValue.strings.join('');
    },
});
