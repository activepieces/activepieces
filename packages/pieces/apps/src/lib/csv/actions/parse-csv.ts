import { createAction, Property, HttpRequest, HttpMethod, httpClient } from "@activepieces/framework";
import { parseCSVFile } from "../utils";

export const parseCSVTextAction = createAction({
  name: 'parse_csv_text',
  displayName: 'Parse CSV Text',
  description: 'Read CSV and automatically parse it into a JSON array:',
  sampleData: [
    {
      "col1": "value",
      "col2": "value",
      "col3": "value"
    },
    {
      "col1": "value",
      "col2": "value",
      "col3": "value"
    }
  ],
  props: {
    csv_text: Property.LongText({
      displayName: 'CSV Text',
      defaultValue: "",
      required: true
    }),
    has_headers: Property.Checkbox({
      displayName: 'CSV contains headers',
      defaultValue: false,
      required: true,
    }),
    delimiter_type: Property.StaticDropdown({
      displayName: 'Delimeter Type',
      description: 'Will try to guess the delimeter',
      defaultValue: '',
      required: true,
      options: {
        options: [
          { label: "Auto", value: "auto" },
          { label: "Comma", value: "," },
          { label: "Tab", value: "\t" }
        ]
      }
    }),
  },
  async run(context) {
    const {csv_text, has_headers, delimiter_type} = context.propsValue
    const config = {
      header: has_headers,
      delimiter: delimiter_type === "auto" ? "" : delimiter_type,
      skipEmptyLines: true
    }

    return parseCSVFile(csv_text, config)
  }
});
