import { createAction, PieceAuth, Property, Validators } from "@activepieces/pieces-framework";

export const modulo = createAction({
    name: 'modulo_math',
    auth: PieceAuth.None(),
    displayName: "Modulo",
    description: 'Get the remainder of the first number divided by second number',
    props: {
        first_number: Property.Number({
            displayName: 'First Number',
            description: undefined,
            required: true,
            validators: [Validators.number]
        }),
        second_number: Property.Number({
            displayName:  'Second Number',
            description: undefined,
            required: true,
            validators: [Validators.number]
        })
    },
    async run(context) {
        return context.propsValue['first_number'] % context.propsValue['second_number'];
    }
});