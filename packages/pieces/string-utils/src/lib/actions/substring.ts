import { Property, Validators, createAction } from "@activepieces/pieces-framework";

export const substring = createAction({
    description: "Find substring (Regex or string).",
    displayName: "Substring",
    name: "substring",
    props: {
        string: Property.ShortText({
            displayName: "String",
            required: true,
        }),
        expression: Property.ShortText({
            displayName: "Expression",
            required: true,
            validators: [Validators.isRegex],
        }),
    },
    run: async (ctx): Promise<RegExpMatchArray | null> => {
        const expression = RegExp(ctx.propsValue.expression);
        return ctx.propsValue.string.match(expression);
    },
});
