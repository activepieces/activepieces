import { createTrigger, StaticPropsValue, TriggerContext, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { generateFakeData } from "../actions/generate-data";

export const newFakeDataTrigger = createTrigger({
  name: "new_fake_data",
  displayName: "New Fake Data Batch",
  description: "Triggers periodically to provide a new batch of fake data.",
  type: TriggerStrategy.POLLING,
  props: {
    count: Property.Number({
      displayName: "Count",
      description: "Number of records to generate per interval (default: 1).",
      required: true,
      defaultValue: 1,
    }),
    fields: Property.Array({
      displayName: "Fields",
      description: "List of fields to generate (e.g., first_name, last_name, email).",
      required: true,
      defaultValue: ["first_name", "last_name", "email"],
    }),
  },
  sampleData: [
    { first_name: "John", last_name: "Doe", email: "john@example.com" }
  ],
  async onEnable(context: TriggerContext<StaticPropsValue>) {},
  async onDisable(context: TriggerContext<StaticPropsValue>) {},
  async run(context: TriggerContext<StaticPropsValue>) {
    const result = await (generateFakeData as any).run({
      propsValue: {
        fields: context.propsValue.fields || ["first_name", "last_name", "email"],
        count: context.propsValue.count || 1,
        locale: "en",
      },
    });
    return result as any[];
  },
  async test(context: TriggerContext<StaticPropsValue>) {
    const result = await (generateFakeData as any).run({
      propsValue: {
        fields: context.propsValue.fields || ["first_name", "last_name", "email"],
        count: 1,
        locale: "en",
      },
    });
    return result as any[];
  }
});
