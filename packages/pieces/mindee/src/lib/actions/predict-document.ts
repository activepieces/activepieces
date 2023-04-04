import { createAction, httpClient, HttpMethod, Property } from "@activepieces/framework";
import { createReadStream } from "fs"
import FormData from "form-data";

import * as path from 'path';

export const mindeePredictDocumentAction = createAction({
  name: 'mindee_predict_document',
  displayName: 'Extract Document',
  description: 'Parse details of a document using OCR.',
  props: {
    authentication: Property.SecretText({
      displayName: 'API KEY',
      description: `
      To access your API KEY
      1. Sign up and log in to Mindee
      2. Go to [API Key page](https://platform.mindee.com/api-keys)
      3. Copy the Key and paste below.
      `,
      required: true,
    }),
    account_name: Property.ShortText({
      displayName: 'Account Name',
      description: 'Refers to your username or organization name with which you signed up with.',
      required: true,
      defaultValue: 'mindee'
    }),
    api_name: Property.StaticDropdown({
      displayName: 'API Name',
      description: 'Refers to the name of the API your are using.',
      required: true,
      defaultValue: 'full',
      options: {
        disabled: false,
        options: [
          { value: 'bank_account_details/v1', label: "Bank Account Details OCR" },
          { value: 'expense_reports/v4', label: "Receipt OCR" },
          { value: 'passport/v1', label: "Passport OCR" },
          { value: 'invoices/v3', label: "Invoice OCR" },
          { value: 'proof_of_address/v1', label: "Proof of Address OCR" },
          { value: 'financial_document/v1', label: "Financial Documents OCR" }
        ]
      }
    }),
    file: Property.LongText({
      displayName: 'File',
      description: 'Remote file URL or Base64 string',
      required: true
    })
  },
  sampleData: {
    "api_request": {
      "error": {},
      "resources": [
        "document"
      ],
      "status": "success",
      "status_code": 201,
      "url": "http://api.mindee.net/v1/products/mindee/invoices/v3/predict"
    },
    "document": {
      "id": "ecdbe7bd-1037-47a5-87a8-b90d49475a1f",
      "name": "sample_invoce.jpeg",
      "n_pages": 1,
      "is_rotation_applied": true,
      "inference": {
        "started_at": "2021-05-06T16:37:28+00:00",
        "finished_at": "2021-05-06T16:37:29+00:00",
        "processing_time": 1.125,
        "pages": [
          {
            "id": 0,
            "orientation": { "value": 0 },
            "prediction": {},
            "extras": {}
          }
        ],
        "prediction": {},
        "extras": {}
      }
    }
  },
  run: async ({ propsValue: { authentication, api_name, account_name, file } }) => {
    let headers, body = {}

    try {
      const form = new FormData()

      if (['https:', 'http:'].includes(new URL(file).protocol))
        form.append('document', await getRemoteFile(file))
      else
        form.append('document', createReadStream(file))

      body = form
      headers = { ...form.getHeaders() }
    } catch (_) {
      body = { 'document': file }
      headers = { 'Content-Type': 'application/json' }
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.mindee.net/v1/products/${account_name}/${api_name}/predict`,
      headers: {
        Authorization: `Token ${(authentication as string)}`,
        ...headers
      },
      body: body
    })

    return response.body
  }
})

async function getRemoteFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  return await response.arrayBuffer();
}