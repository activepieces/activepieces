
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { translateText } from './lib/actions/translateText';

const markdownDescription = `
Follow these instructions to get your DeepL API Key:

1. Visit the following website: https://www.deepl.com/fr/pro-checkout/account?productId=1200&yearly=false&trial=false.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your DeepL account to get access to the API Key.
`

//export const deeplAuth = PieceAuth.SecretText({
//  description: markdownDescription,
//  displayName: 'Api Key',
//  required: true,
//})

export const deeplAuth = PieceAuth.CustomAuth({
  displayName: 'API Authentication',
  description: 'Enter custom authentication details',
  props: {
      key: Property.ShortText({
          displayName: 'Api key',
          description: 'Enter the api key',
          required: true,
      }),
      type: Property.StaticDropdown({
        displayName: 'Api url',
        description: 'Select api url',
        required: true,
        options: {
            options: [
                {
                    label: 'Free API',    
                    value: 'free'
                },
                {
                    label: 'Paid API',
                    value: 'paid'
                }
            ]
        }
    })
  },
  // Optional Validation
  validate: async ({auth}) => {
      if(auth){
          return {
              valid: true,
          }
      }
      return {
          valid: false,
          error: 'Invalid Api Key'
      }
  },
  required: true
})

export const deepl = createPiece({
  displayName: "DeepL",
  auth: deeplAuth,
  minimumSupportedRelease: '0.6.0',
  logoUrl: "https://cdn.activepieces.com/pieces/deepl.png",
  authors: ['BBND'],
  actions: [translateText],
  triggers: [],
});
