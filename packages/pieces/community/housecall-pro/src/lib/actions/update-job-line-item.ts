import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const updateJobLineItem = createAction({
  auth: housecallProAuth,
  name: "update_job_line_item",
  displayName: "Update a single line item for a job",
  description: "Update a specific line item for a job",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job",
      required: true,
    }),
    id: Property.ShortText({
      displayName: "Line Item ID",
      description: "The ID of the line item",
      required: true,
    }),
    service_line_id: Property.ShortText({
      displayName: "Service Line ID",
      description: "The ID of the service line",
      required: false,
    }),
    service_line_type: Property.StaticDropdown({
      displayName: "Service Line Type",
      description: "The type of service line",
      required: false,
      options: {
        options: [
          { label: "Custom Place", value: "custom_place" },
          { label: "Organization", value: "organization" },
          { label: "PriceBook Material", value: "pricebok_material" },
        ],
      },
    }),
    name: Property.ShortText({
      displayName: "Name",
      description: "The name of the line item",
      required: false,
    }),
    unit_price: Property.Number({
      displayName: "Unit Price",
      description: "The unit price of the line item",
      required: false,
    }),
    unit_cost: Property.Number({
      displayName: "Unit Cost",
      description: "The unit cost of the line item",
      required: false,
    }),
    quantity: Property.Number({
      displayName: "Quantity",
      description: "The number of items being sold",
      required: false,
    }),
    kind: Property.StaticDropdown({
      displayName: "Kind",
      description: "The kind of line item",
      required: false,
      options: {
        options: [
          { label: "Material", value: "material" },
          { label: "Labor", value: "labor" },
          { label: "Flat Quantity", value: "flat_quantity" },
          { label: "Fixed Discount", value: "fixed_discount" },
          { label: "Percent Discount", value: "percent_discount" },
        ],
      },
    }),
    taxable: Property.Checkbox({
      displayName: "Taxable",
      description: "Whether the line item is taxable",
      required: false,
    }),
    description: Property.ShortText({
      displayName: "Description",
      description: "The description of the line item",
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};

    if (propsValue['service_line_id']) body['service_line_id'] = propsValue['service_line_id'];
    if (propsValue['service_line_type']) body['service_line_type'] = propsValue['service_line_type'];
    if (propsValue['name']) body['name'] = propsValue['name'];
    if (propsValue['unit_price'] !== undefined) body['unit_price'] = propsValue['unit_price'];
    if (propsValue['unit_cost'] !== undefined) body['unit_cost'] = propsValue['unit_cost'];
    if (propsValue['quantity'] !== undefined) body['quantity'] = propsValue['quantity'];
    if (propsValue['kind']) body['kind'] = propsValue['kind'];
    if (propsValue['taxable'] !== undefined) body['taxable'] = propsValue['taxable'];
    if (propsValue['description']) body['description'] = propsValue['description'];

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/line_items/${propsValue['id']}`,
      HttpMethod.PUT,
      body
    );

    return response.body;
  },
});
