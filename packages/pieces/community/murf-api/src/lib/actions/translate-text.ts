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
      auth ,
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
