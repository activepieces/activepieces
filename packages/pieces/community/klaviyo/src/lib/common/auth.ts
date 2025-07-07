import { PieceAuth, Property } from "@activepieces/pieces-framework";

export const klaviyoAuth = PieceAuth.CustomAuth({
    
    description: 'Enter custom authentication details',
    props: {
        api_key: Property.ShortText({
            displayName: 'Klaviyo API Key',
            description: '',
            required: true,
        }),
        private_api_key: PieceAuth.SecretText({
            displayName: 'Private Api Key',
            description: '',
            required: true
        })
    },
    // Optional Validation
    // validate: async ({ auth }) => {
    //     if (auth) {
    //         return {
    //             valid: true,
    //         }
    //     }
    //     return {
    //         valid: false,
    //         error: 'Invalid Api Key'
    //     }
    // },
    required: true
})