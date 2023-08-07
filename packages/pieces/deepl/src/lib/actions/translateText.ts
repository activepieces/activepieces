import { createAction, Property } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { deeplAuth } from '../..';

export const translateText = createAction({
	name: 'translate_text', // Must be a unique across the piece, this shouldn't be changed.
    auth: deeplAuth,
    displayName:'Translate text',
    description: 'Translate a text to the target language',
	props: {
		text: Property.LongText({
            displayName: 'Text',
            required: true,
            description: 'The text to be translated.',
        }),
        target_lang: Property.StaticDropdown({
            displayName: 'Target language',
            description: 'Select the target language',
            required: true,
            options: {
                options: [
                    {value: 'BG' , label: 'Bulgarian'},
                    {value: 'CS' , label: 'Czech'},
                    {value: 'DA' , label: 'Danish'},
                    {value: 'DE' , label: 'German'},
                    {value: 'EL' , label: 'Greek'},
                    {value: 'EN-GB' , label: 'English (British)'},
                    {value: 'EN-US' , label: 'English (American)'},
                    {value: 'ES' , label: 'Spanish'},
                    {value: 'ET' , label: 'Estonian'},
                    {value: 'FI' , label: 'Finnish'},
                    {value: 'FR' , label: 'French'},
                    {value: 'HU' , label: 'Hungarian'},
                    {value: 'ID' , label: 'Indonesian'},
                    {value: 'IT' , label: 'Italian'},
                    {value: 'JA' , label: 'Japanese'},
                    {value: 'KO' , label: 'Korean'},
                    {value: 'LT' , label: 'Lithuanian'},
                    {value: 'LV' , label: 'Latvian'},
                    {value: 'NB' , label: 'Norwegian'},
                    {value: 'NL' , label: 'Dutch'},
                    {value: 'PL' , label: 'Polish'},
                    {value: 'PT-BR' , label: 'Portuguese (Brazilian)'},
                    {value: 'PT-PT' , label: 'Portuguese'},
                    {value: 'RO' , label: 'Romanian'},
                    {value: 'RU' , label: 'Russian'},
                    {value: 'SK' , label: 'Slovak'},
                    {value: 'SL' , label: 'Slovenian'},
                    {value: 'SV' , label: 'Swedish'},
                    {value: 'TR' , label: 'Turkish'},
                    {value: 'UK' , label: 'Ukrainian'},
                    {value: 'ZH' , label: 'Chinese (simplified)'}
                ]
            }
        })
	},
    sampleData: {
        "translations": [
            {
              "detected_source_language": "EN",
              "text": "Hallo, Welt!"
            }
        ]
    },
	async run(context) {
        const DEEPL_FREE_URL = "https://api-free.deepl.com/v2/translate";
        const DEEPL_PAID_URL = "https://api.deepl.com/v2/translate";
        const { text, target_lang } = context.propsValue
        const text_translated = await httpClient.sendRequest<string[]>({
			method: HttpMethod.POST,
			url: (context.auth.type === 'free') ? DEEPL_FREE_URL : DEEPL_PAID_URL,
            headers: {
                'Authorization': `DeepL-Auth-Key ${context.auth.key}`,
                'Content-Type': 'application/json'
            },
            body: {
                text: [
                    text
                ],
                target_lang: target_lang
            }
		});

		return text_translated;
	},
});

