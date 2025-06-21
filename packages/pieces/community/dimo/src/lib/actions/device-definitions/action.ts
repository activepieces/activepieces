import { createAction, Property } from "@activepieces/pieces-framework";
import { getHeaders, handleFailures } from "../../helpers";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import {
  DIMO_DECODE_VIN_ENDPOINT,
  DIMO_SEARCH_ENDPOINT,
} from "./constant";
import {
  DeviceDefinitionResponse,
  DeviceDefinitionsSearchResponse,
} from "./type";
import { dimoAuth } from "../../../index";

export const deviceDefinitionApiAction = createAction({
  auth: dimoAuth,
  name: "submit-decode-vin-device-definitions-api",
  displayName: "Submit Decode VIN via Device Definitions API",
  description: "Submits a decoding request for vehicle identification number, returns the device definition ID corresponding to the VIN.",
  props: {
    countryCode: Property.ShortText({
      displayName: "Country Code",
      description: "3-letter ISO 3166-1 alpha-3 country code (e.g. USA)",
      required: true,
    }),
    vin: Property.ShortText({
      displayName: "VIN",
      description: "Vehicle Identification Number",
      required: true,
    }),
  },
  run: async (ctx) => {
    const { countryCode, vin } = ctx.propsValue;
    const { developerJwt } = ctx.auth;
    const response = await httpClient.sendRequest<DeviceDefinitionResponse>({
      method: HttpMethod.POST,
      url: DIMO_DECODE_VIN_ENDPOINT,
      body: {
        countryCode,
        vin,
      },
      headers: getHeaders(developerJwt),
    });
    handleFailures(response);
    return {
      deviceDefinitionId: response.body.deviceDefinitionId,
      newTransactionHash: response.body.newTransactionHash,
    };
  },
});

export const deviceDefinitionsSearchAction = createAction({
  auth: dimoAuth,
  name: "lookup-device-definitions-api",
  displayName: "Device Definitions Lookup",
  description: "Search for device definitions by query and filters.",
  props: {
    query: Property.ShortText({
      displayName: "Query",
      description: "Query filter (e.g. Lexus gx 2023)",
      required: true,
    }),
    makeSlug: Property.ShortText({
      displayName: "Make Slug",
      description: "Make of the vehicle (e.g. audi, lexus, etc)",
      required: false,
    }),
    modelSlug: Property.ShortText({
      displayName: "Model Slug",
      description: "Model of the vehicle (e.g. Tacoma, Accord, etc)",
      required: false,
    }),
    year: Property.Number({
      displayName: "Year",
      description: "Year of the vehicle (e.g. 2024)",
      required: false,
    }),
    page: Property.Number({
      displayName: "Page",
      description: "Page number (for pagination, defaults to 1)",
      required: false,
    }),
    pageSize: Property.Number({
      displayName: "Page Size",
      description: "Page size (items per page)",
      required: false,
    }),
  },
  run: async (ctx) => {
    const { query, makeSlug, modelSlug, year, page, pageSize } = ctx.propsValue;
    const { developerJwt } = ctx.auth;
    const params = new URLSearchParams();
    params.append('query', query);
    if (makeSlug) params.append('makeSlug', makeSlug);
    if (modelSlug) params.append('modelSlug', modelSlug);
    if (year) params.append('year', year.toString());
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('pageSize', pageSize.toString());
    const url = `${DIMO_SEARCH_ENDPOINT}?${params.toString()}`;
    const response = await httpClient.sendRequest<DeviceDefinitionsSearchResponse>({
      method: HttpMethod.GET,
      url,
      headers: getHeaders(developerJwt),
    });
    handleFailures(response);
    return response.body;
  },
});
