import { ActionContext, createAction, Property } from "@activepieces/pieces-framework";

export const mockApiAction = createAction({
  name: "mock_api",
  displayName: "Mock API",
  description: "Return a simulated API response with custom status and delay.",
  props: {
    responseTemplate: Property.Json({
      displayName: "Response Template",
      description: "The JSON body to return in the response.",
      required: true,
    }),
    statusCode: Property.Number({
      displayName: "Status Code",
      description: "The HTTP status code to return (e.g., 200, 404, 500).",
      required: true,
      defaultValue: 200,
    }),
    delay: Property.Number({
      displayName: "Delay (ms)",
      description: "Optional delay before returning the response (0-5000ms).",
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context: ActionContext) {
    const { responseTemplate, statusCode, delay } = context.propsValue;
    
    if (delay && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 5000)));
    }
    
    return {
      status: statusCode,
      body: responseTemplate,
    };
  },
});
