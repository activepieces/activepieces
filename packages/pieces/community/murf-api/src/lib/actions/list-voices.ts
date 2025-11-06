import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "../common/client";
import { murfAuth } from "../common/auth";
import { murfCommon } from "../common/dropdown";

export const listVoices = createAction({
  auth: murfAuth,
  name: "list-voices",
  displayName: "List Voices",
  description: "Get the list of available voices for text-to-speech",
  props: {
    locale: murfCommon.language,
    style: Property.Dropdown({
      displayName: "Style",
      description: "Filter by style (optional)",
      required: false,
      refreshers: ["locale"],
      options: async ({ auth, locale }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: "Please connect your Murf account first",
          };
        }

        const response = await makeRequest(auth as string , HttpMethod.GET, "/speech/voices");
        const voices = Array.isArray(response) ? response : [];

       
        const filtered = locale
          ? voices.filter((v: any) => v.locale === locale || (Array.isArray(v.supportedLocales) && v.supportedLocales.includes(locale)))
          : voices;

        const allStyles = new Set<string>();
        filtered.forEach((voice: any) => {
          if (Array.isArray(voice.availableStyles)) {
            voice.availableStyles.forEach((s: string) => allStyles.add(s));
          }
        });

        return {
          disabled: false,
          options: [
            { label: "All Styles", value: "" },
            ...Array.from(allStyles).map((s) => ({
              label: s.charAt(0).toUpperCase() + s.slice(1),
              value: s,
            })),
          ],
        };
      },
    }),
  },

  async run(context) {
    const { locale, style } = context.propsValue;

    const response = await makeRequest(context.auth, HttpMethod.GET, "/speech/voices");
    const voices = Array.isArray(response) ? response : [];

    let filtered = voices;
    if (locale) {
      filtered = filtered.filter(
        (v: any) => v.locale === locale || (Array.isArray(v.supportedLocales) && v.supportedLocales.includes(locale))
      );
    }
    if (style) {
      filtered = filtered.filter((v: any) =>
        v.availableStyles?.includes(style)
      );
    }

    return {
      voices: filtered.map((voice: any) => ({
        voiceId: voice.voiceId,
        displayName: voice.displayName,
        gender: voice.gender,
        locale: voice.locale,
        supportedLocales: voice.supportedLocales,
        availableStyles: voice.availableStyles,
      })),
    };
  },
});
