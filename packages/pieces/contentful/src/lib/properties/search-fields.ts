import { DynamicPropsValue, Property } from "@activepieces/pieces-framework";
import { ContentfulAuth, PropertyKeys, makeClient } from "../common";
import _ from "lodash";
import { FieldType } from "contentful-management";
import { FieldTransformers } from "./transformers";

const supportedFieldTypes: FieldType['type'][] = ['Boolean', 'Date', 'Integer', 'Number', 'Symbol', 'Text']

const SearchFields = Property.DynamicProperties({
  displayName: "Search Fields",
  description: "Fields to search for",
  required: true,
  refreshers: [PropertyKeys.CONTENT_MODEL],
  props: async ({ auth, [PropertyKeys.CONTENT_MODEL]: model }) => {
    if (_.isEmpty(auth) || _.isNil(model)) return {};
    const searchFields: DynamicPropsValue = {};

    const { client } = makeClient(auth as ContentfulAuth);
    try {
      const contentModel = await client.contentType.get({
        contentTypeId: model as unknown as string,
      });
      // Remove fields that are disabled or omitted from the API
      contentModel.fields
        .filter((f) => !!f.id && !f.omitted && !f.disabled && !f.deleted)
        .filter((f) => supportedFieldTypes.includes(f.type as FieldType['type']))
        .map((f) => {
          const transformer = FieldTransformers[f.type as FieldType['type']];
          if (transformer) {
            const property = transformer(f);
            if (!property) return;
            searchFields[f.id] = {
              ...property,
              required: false,
            };
            return;
          }
        });
    } catch (e) {
      console.debug(e);
    }
    return searchFields;
  }
})

export default SearchFields;
