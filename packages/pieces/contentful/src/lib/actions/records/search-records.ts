import { Property, createAction } from "@activepieces/pieces-framework";
import { ContentfulAuth, PropertyKeys } from "../../common";
import { ContentfulProperty } from "../../properties";

export const ContentfulSearchRecordsAction = createAction({
  name: "contentful_record_search",
  auth: ContentfulAuth,
  displayName: "Search Records",
  description: "Searches for records of a given Content Model",
  props: {
    [PropertyKeys.CONTENT_MODEL]: ContentfulProperty.ContentModel,
    [PropertyKeys.QUERY]: Property.Json({
      displayName: "Custom Query",
      required: false,
      description: "Allows for a custom query to be passed to the API",
    }),
    [PropertyKeys.SEARCH_FIELDS]: ContentfulProperty.SearchFields,
  },
  async run({ auth, propsValue }) {
    return propsValue
  }
})
