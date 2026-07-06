import { createAction, Property } from "@activepieces/pieces-framework";
import { murfAuth } from "../common/auth"; 
import { murfCommon } from "../common/dropdown";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";

export const translateText = createAction({
  auth: murfAuth,
  name: "translateText",
  displayName: "Translate Text",
  description: "Translate one or more texts to the target language.",
  audience: 'both',
  aiMetadata: { description: 'Translates one or more text strings into a target language using Murf. Choose it when you need translated text (often as a precursor to generating multilingual speech). Requires the target language code and at least one input string. Each call issues a fresh translation request and is not idempotent.', idempotent: false },
  props: {
    targetLanguage: murfCommon.language,
    texts: Property.Array({
      displayName: "Texts",
      description: "List of texts to translate",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await makeRequest(
      auth.secret_text ,
      HttpMethod.POST,
      "/text/translate",
      {
        target_language: propsValue.targetLanguage,
        texts: propsValue.texts,
      }
    );

    return response;
  },
});
