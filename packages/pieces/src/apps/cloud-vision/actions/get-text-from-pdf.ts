import { createAction } from '../../../framework/action/action';
import { Property } from '../../../framework/property/prop.model';
import { GoogleAuth } from 'google-auth-library';

import { ImageAnnotatorClient } from '@google-cloud/vision';
import { ClientOptions } from 'google-gax';
import { createAuth } from './google-auth';
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
  name: 'convert_pdf_to_text', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Convert pdf to text',
  description: 'using google cloud vision will convert pdf to text',
  props: {
    // Properties to ask from the user, in this ask we will take number of
    serviceAccountCredentials: Property.LongText({
      displayName: 'Service Account Credentials',
      required: true,
      // states: {
      //   "^regex$": {
      //     show:[]
      //   }
      // }
    }),
    allPages: Property.Checkbox({
      displayName: 'Do you want to convert all pages ?',
      required: false,
      // states: {
      //   true: {
      //     show: ['startingPage', 'endingPage'],
      //   },
      //   false: {
      //     hide: ['startingPage', 'endingPage'],
      //   },
      // },
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

    const detectedText = firstResponse.responses.map(
      (response) => response.fullTextAnnotation
    );
    return detectedText;
  },
});
