import { createAction, PieceAuth, Property, Validators } from "@activepieces/pieces-framework";

export const subtraction = createAction({
    name: 'subtraction_math',
    auth: PieceAuth.None(),
    displayName: "Subtraction",
    description: 'Subtract the first number from the second number',
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
        return context.propsValue['second_number'] - context.propsValue['first_number'];
    }
});