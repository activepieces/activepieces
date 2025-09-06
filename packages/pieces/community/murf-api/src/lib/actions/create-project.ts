import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "../common/client";
import { murfAuth } from "../common/auth";
import { languageDropdown } from "../common/dropdown";

export const createProject = createAction({
  auth: murfAuth,
  name: "create_project",
  displayName: "Create Project",
  description: "Creates a new dubbing project in Murf.",
  props: {
    name: Property.ShortText({
      displayName: "Project Name",
      required: true,
    }),
    dubbingType: Property.StaticDropdown({
      displayName: "Dubbing Type",
      required: true,
      options: {
        options: [
          { label: "Automated", value: "AUTOMATED" },
          { label: "QA", value: "QA" },
        ],
      },
    }),
    sourceLocale: Property.ShortText({
      displayName: "Source Locale",
      description: "Optional source locale (e.g., en_US)",
      required: false,
    }),
    targetLocales: languageDropdown,
    description: Property.LongText({
      displayName: "Description",
      description: "Optional project description",
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const body = {
      name: propsValue.name,
      dubbing_type: propsValue.dubbingType,
      target_locales: propsValue.targetLocales,
      source_locale: propsValue.sourceLocale,
      description: propsValue.description,
    };

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      "/murfdub/projects/create",
      body,
      undefined,
      true

    );

    return response;
  },
});
