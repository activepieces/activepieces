import { birdHttpClient } from "../common/http";
import { createAction, Property } from "@activepieces/pieces-framework";
import { birdAuth } from "../auth";
import { birdCustomRequest } from "../common/custom-request";

export const customApiCall = createAction({
  name: "custom_api_call",
  displayName: "Custom API Call",
  description: "Call a Bird API endpoint with your saved connection.",
  auth: birdAuth,
  classification: "WRITE",
  audience: "human",
  aiMetadata: {
    description:
      "Make an authenticated request to a Bird API endpoint using a relative path and optional JSON body. The connection selects the region and must have permission for the endpoint. The selected method can change data or send messages; requests do not automatically retry or follow redirects. Supply a stable Idempotency-Key when the endpoint supports deliberate retries.",
    idempotent: false,
  },
  props: {
    method: Property.StaticDropdown({
      displayName: "Method",
      required: true,
      defaultValue: "GET",
      options: {
        options: birdCustomRequest.methods.map((value) => ({
          label: value,
          value,
        })),
      },
    }),
    path: Property.ShortText({
      displayName: "API path",
      required: true,
      defaultValue: "/v1/workspace",
      description:
        "Enter a versioned API path, such as /v1/workspace. The connection selects the regional Bird host. Your connection must have permission for this endpoint.",
    }),
    headers: Property.Object({
      displayName: "Headers",
      required: false,
      description:
        "Optional request headers, such as Idempotency-Key. Authentication, workspace and JSON headers are set automatically.",
    }),
    queryParams: Property.Object({
      displayName: "Query parameters",
      required: false,
      description:
        "Names and values to add to the URL. Map arrays to send repeated parameters.",
    }),
    body_enabled: Property.Checkbox({
      displayName: "Send JSON body",
      required: false,
      defaultValue: false,
      reveals: ["body"],
    }),
    body: Property.Json({
      displayName: "JSON body",
      required: false,
      description:
        "Enter the JSON body required by this endpoint. File uploads and other body formats are not supported.",
    }),
  },
  propertyGroups: [
    {
      key: "request",
      display: "section",
      label: "Request",
      props: ["method", "path", "headers", "queryParams", "body_enabled"],
    },
  ],
  outputSchema: {
    fields: [
      { key: "status", label: "Status", format: "number" },
      { key: "headers", label: "Headers", dynamicKey: true },
      { key: "body", label: "Body" },
    ],
  },
  errorHandlingOptions: {
    retryOnFailure: { defaultValue: false, hide: true },
    continueOnFailure: { defaultValue: false, hide: false },
  },
  async run(context) {
    return birdCustomRequest.execute({
      auth: context.auth,
      props: {
        ...context.propsValue,
        body: context.propsValue.body_enabled
          ? context.propsValue.body
          : undefined,
      },
      httpClient: birdHttpClient,
    });
  },
});
