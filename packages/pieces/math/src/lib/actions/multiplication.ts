import { PieceAuth, Property, Validators, createAction } from "@activepieces/pieces-framework";

export const multiplication = createAction({
    name: 'multiplication_math',
    auth: PieceAuth.None(),
    displayName: 'Multiplicattion',
    description: 'Multiply first number by the second number',
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
        return context.propsValue['first_number'] * context.propsValue['second_number'];
    }
});