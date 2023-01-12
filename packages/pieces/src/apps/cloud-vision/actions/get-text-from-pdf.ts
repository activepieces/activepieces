import { createAction } from '../../../framework/action/action';
import { Property } from '../../../framework/property/prop.model';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { createAuth } from '../common/google-auth';
import { assertNotNullOrUndefined } from '../../../common/helpers/assertions';

function createClient(auth: any) {
  const clientOptions = { auth };
  return new ImageAnnotatorClient(clientOptions);
}

function createInputConfig(googleCloudStorageLocation: string) {
  return {
    mimeType: 'application/pdf',
    gcsSource: {
      uri: googleCloudStorageLocation,
    },
  };
}

function createFileRequest(inputConfig: any, features: any, pages: any) {
  return {
    inputConfig,
    features,
    pages,
  };
}

export const convertPdfToText = createAction({
  name: 'convert_pdf_to_text',
  displayName: 'Convert pdf to text',
  description: 'using google cloud vision will convert pdf to text',
  props: {
    serviceAccountCredentials: Property.LongText({
      displayName: 'Service Account Credentials',
      required: true,
    }),
    allPages: Property.Checkbox({
      displayName: 'Do you want to convert all pages ?',
      required: false,
      description: 'If checked, starting and ending page will be ignored',
    }),
    startingPage: Property.Number({
      displayName: 'Starting Page',
      required: false,
      description: 'Starting page number',
    }),
    endingPage: Property.Number({
      displayName: 'Ending Page',
      required: false,
      description: 'Ending page number',
    }),
    googleCloudStorageLocation: Property.ShortText({
      displayName: 'Google Cloud Storage Location',
      required: true,
      description: 'gs://direct-upload/hello.pdf',
    }),
  },
  async run({ propsValue }) {
    const auth = createAuth(propsValue.serviceAccountCredentials!);
    const client = createClient(auth);
    const inputConfig = createInputConfig(
      propsValue['googleCloudStorageLocation']!
    );
    const features = [{ type: 'DOCUMENT_TEXT_DETECTION' }];
    if (propsValue.allPages) {
      propsValue.startingPage = 1;
      propsValue.endingPage = -1;
    }
    const fileRequest = createFileRequest(inputConfig, features, [
      propsValue.startingPage,
      propsValue.endingPage,
    ]);
    const request = { requests: [fileRequest] };

    const [result] = await client.batchAnnotateFiles(request);
    assertNotNullOrUndefined(
      result.responses,
      'No response from google cloud vision',
      0
    );

    const [firstResponse] = result.responses;
    assertNotNullOrUndefined(
      firstResponse.responses,
      'No response from google cloud vision',
      0
    );

    let detectedText = '';
    for (const response of firstResponse.responses) {
      assertNotNullOrUndefined(
        response.fullTextAnnotation,
        'No response from google cloud vision',
        0
      );
      const pageNumber = firstResponse.responses.indexOf(response) + 1;
      detectedText += `Page ${pageNumber}:`;
      detectedText += response.fullTextAnnotation.text;
    }

    return detectedText;
  },
});
