import { Property, Validators, createAction } from "@activepieces/pieces-framework";

export const replace = createAction({
    description: "Replace a string with another (Regex or string).",
    displayName: "Replace",
    name: "replace",
    props: {
        string: Property.ShortText({
            displayName: "String",
            required: true,
        }),
        searchValue: Property.ShortText({
            displayName: "Search Value",
            required: true,
            validators: [Validators.isRegex],
        }),
        replaceValue: Property.ShortText({
            displayName: "Replace Value",
            required: true,
        }),
    },
    run: async (ctx) => {
        const expression = RegExp(ctx.propsValue.searchValue);
        return ctx.propsValue.string.replace(expression, ctx.propsValue.replaceValue);
    },
});
