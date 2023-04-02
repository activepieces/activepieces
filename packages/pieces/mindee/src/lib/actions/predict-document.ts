import { AuthenticationType, createAction, httpClient, HttpMethod, Property } from "@activepieces/framework";
import { createReadStream } from "fs"
import FormData from "form-data";

export const mindeePredictDocumentAction = createAction({
  name: 'mindee_predict_document',
  displayName: 'Extract Document',
  description: 'Parse details of a document using OCR.',
  props: {
    authentication: Property.SecretText({
      displayName: 'API KEY',
      description: 'Your API Key Token',
      required: true,
    }),
    account_name: Property.ShortText({
      displayName: 'Account Name',
      description: 'Refers to your username or organization name with which you signed up with.',
      required: true,
    }),
    api_name: Property.StaticDropdown({
      displayName: 'API Name',
      description: 'Refers to the name of the API your are using.',
      required: true,
      defaultValue: 'full',
      options: {
        disabled: false,
        options: [
          { value: 'bank_account_details', label: "Bank Account Details OCR" },
          { value: 'expense_reports', label: "Receipt OCR" },
          { value: 'passport', label: "Passport OCR" },
          { value: 'invoices', label: "Invoice OCR" },
          { value: 'proof_of_address', label: "Proof of Address OCR" },
          { value: 'financial_document', label: "Financial Documents OCR" }
        ]
      }
    }),
    file: Property.LongText({
      displayName: 'File',
      description: 'File URL or Base64',
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
    const params: Record<string, unknown> = {}
    
    try {
      const form = new FormData()
      const url = new URL(file)
      if (['https:', 'http:'].includes(url.protocol))
        form.append('document', createReadStream(file))

      params['headers'] = { ...form.getHeaders() }
      params['data'] = form
    } catch (_) {
      params['headers'] = { 'Content-Type': 'application/json' }
      params['body'] = { 'document': file }
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.mindee.net/v1/products/${account_name}/${api_name}/v1/predict`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (authentication as string)
      },
      ...params
    })
    return response.body;
  }
})