import { Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const docsbotCommon = {
  teamId: Property.Dropdown({
    displayName: "Team",
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: "Please connect your DocsBot account first.",
          options: [],
        };
      }

      const request = {
        method: HttpMethod.GET,
        url: `https://docsbot.ai/api/teams`,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      };

      const response = await httpClient.sendRequest<{ id: string; name: string }[]>(request);

      const options = response.body.map((team) => ({
        label: team.name,
        value: team.id,
      }));

      return {
        disabled: false,
        options,
      };
    },
  }),

  botId: Property.Dropdown({
    displayName: "Bot",
    required: true,
    refreshers: ["teamId"],
    options: async ({ auth, teamId }) => {
      if (!auth || !teamId) {
        return {
          disabled: true,
          placeholder: "Please select a team first.",
          options: [],
        };
      }

      const request = {
        method: HttpMethod.GET,
        url: `https://docsbot.ai/api/teams/${teamId}/bots`,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      };

      const response = await httpClient.sendRequest<{ id: string; name: string }[]>(request);

      const options = response.body.map((bot) => ({
        label: bot.name,
        value: bot.id,
      }));

      return {
        disabled: false,
        options,
      };
    },
  }),

  language: Property.StaticDropdown({
    displayName: "Language",
    description: "Choose the language for your bot.",
    required: true,
    options: {
      options: [
        { label: "English", value: "en" },
        { label: "日本語 (Japanese)", value: "ja" },
        { label: "العربية (Arabic)", value: "ar" },
        { label: "简体中文 (Chinese Simplified)", value: "zh" },
        { label: "Čeština (Czech)", value: "cs" },
        { label: "Dansk (Danish)", value: "da" },
        { label: "Nederlands (Dutch)", value: "nl" },
        { label: "Filipino", value: "fil" },
        { label: "Suomi (Finnish)", value: "fi" },
        { label: "Français (French)", value: "fr" },
        { label: "Deutsch (German)", value: "de" },
        { label: "Ελληνικά (Greek)", value: "el" },
        { label: "עברית (Hebrew)", value: "he" },
        { label: "हिन्दी (Hindi)", value: "hi" },
        { label: "Magyar (Hungarian)", value: "hu" },
        { label: "Bahasa Indonesia (Indonesian)", value: "id" },
        { label: "Italiano (Italian)", value: "it" },
        { label: "한국어 (Korean)", value: "ko" },
        { label: "Norsk (Norwegian)", value: "no" },
        { label: "Polski (Polish)", value: "pl" },
        { label: "Português (Portuguese)", value: "pt" },
        { label: "Română (Romanian)", value: "ro" },
        { label: "Русский (Russian)", value: "ru" },
        { label: "Српски (Serbian)", value: "sr" },
        { label: "Español (Spanish)", value: "es" },
        { label: "Kiswahili (Swahili)", value: "sw" },
        { label: "Svenska (Swedish)", value: "sv" },
        { label: "ไทย (Thai)", value: "th" },
        { label: "Türkçe (Turkish)", value: "tr" },
      ],
    },
  }),
};
