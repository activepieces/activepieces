import { DropdownProperty, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";
import { string } from "zod";

export const DatasourceDropdown = Property.Dropdown<string>({
  displayName: "Data Source",
  description: "Select the data source to insert the text blob into",
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: "Please connect your Insighto.ai account first",
      };
    }

    try {
      // Fetch available data sources
      const response = await makeRequest(auth as string, HttpMethod.GET, "/datasources");

      const options = (response?.data || []).map((ds: any) => ({
        label: ds.name || `Data Source ${ds.id}`,
        value: ds.id,
      }));

      return {
        disabled: false,
        options,
      };
    } catch (e: any) {
      return {
        disabled: true,
        options: [],
        placeholder: "Failed to fetch data sources. Check your API Key.",
      };
    }
  },
});

export const WidgetDropdown = Property.Dropdown<string>({
  displayName: "Widget ID",
  description: "Select the Widget to use for making the outbound call",
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: "Connect your Insighto.ai account to select widget",
      };
    }
    try {

      const response = await makeRequest(auth as string, HttpMethod.GET, "/widget");

      const widgets = (response?.data || []) as Array<any>;
      const options = widgets.map(w => ({
        label: w.name || `Widget ${w.id}`,
        value: w.id,
      }));
      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: "Failed to fetch widgets. Check credentials or permissions.",
      };
    }
  },
});

export const AssistantDropdown = Property.Dropdown<string>({
  displayName: 'Assistant',
  description: 'Select the assistant for which you want to capture conversations.',
  required: true,
  refreshers: [],

  async options({ auth }) {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
        const response = await makeRequest(auth as string, HttpMethod.GET, "/assistant");

      const assistants = response.body.data || [];

      return {
        disabled: false,
        options: assistants.map((assistant: any) => ({
          label: assistant.name,
          value: assistant.id,
        })),
      };
    } catch (error) {
      console.error('Error fetching assistants:', error);
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load assistants',
      };
    }
  },
});