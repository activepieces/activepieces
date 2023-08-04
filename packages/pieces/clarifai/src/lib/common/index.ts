import { Property, ApFile } from '@activepieces/pieces-framework';
import { grpc } from 'clarifai-nodejs-grpc';
import { Data, Input, UserAppIDSet, Image } from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';
import { V2Client } from 'clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb';
import { MultiOutputResponse, PostModelOutputsRequest } from 'clarifai-nodejs-grpc/proto/clarifai/api/service_pb';
import { promisify } from 'util';

function initClarifaiClient() {
    const clarifai = new V2Client("api.clarifai.com", grpc.ChannelCredentials.createSsl());
    return clarifai;
}

export const clarifaiClient = initClarifaiClient();

export interface CallModelRequest {
    auth: string;
    modelUrl: string;
    input: ApFile;
}

export function callClarifaiModel({ auth, modelUrl, input }: CallModelRequest) {
    const [userId, appId, modelId, versionId] = parseEntityUrl(modelUrl);

    const req = new PostModelOutputsRequest();
    req.setUserAppId(userAppIdSet(userId, appId));
    req.setModelId(modelId);
    if (versionId) {
        req.setVersionId(versionId);
    }
    req.setInputsList([createImageInput(input)])

    const metadata = authMetadata(auth);
    // TODO: we should really be using the async version of this, circle back with clarifai team to see if we can
    // tweak the protoc settings to build a promise-compatible version of our API client.
    const postModelOutputs = promisify<PostModelOutputsRequest, grpc.Metadata, MultiOutputResponse>(clarifaiClient.postModelOutputs.bind(clarifaiClient));
    return postModelOutputs(req, metadata);
}

function createImageInput(file: ApFile) {
    const input = new Input();
    const inputData = new Data();
    const dataImage = new Image();
    dataImage.setBase64(file.base64);
    inputData.setImage(dataImage);
    input.setData(inputData);
    return input;
}

function userAppIdSet(userId: string, appId: string) {
    const set = new UserAppIDSet();
    set.setUserId(userId);
    set.setAppId(appId);
    return set;
}

function authMetadata(auth: string) {
    const metadata = new grpc.Metadata();
    metadata.set("authorization", "Key " + auth);
    return metadata;
}

export const CommonClarifaiProps = {
    modelUrl: Property.ShortText({
        description: 'URL of the Clarifai model. For example https://clarifai.com/clarifai/main/models/general-image-recognition OR a specific version such as https://clarifai.com/clarifai/main/models/general-image-recognition/versions/aa7f35c01e0642fda5cf400f543e7c40. Find more visual classifiers at https://clarifai.com/explore/models?filterData=%5B%7B%22field%22%3A%22model_type_id%22%2C%22value%22%3A%5B%22visual-classifier%22%5D%7D%5D&page=1&perPage=24',
        displayName: 'Model URL',
        required: true,
    }),
};

function parseEntityUrl(entityUrl: string): [string, string, string, string] {
    const url = new URL(entityUrl);
    const parts = url.pathname.split('/')
    let version = '';
    if (parts.length === 7 && parts[5] === 'versions') {
        version = parts[6];
    }
    return [parts[1], parts[2], parts[4], version];
}

export function removeListFromPropertyNames(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.endsWith('List') && Array.isArray(value)) {
      if (value.length === 0) { // remove empty lists by default
          continue;
      }
      // remove 'List' and recurse on every item in the array
      result[key.slice(0, -4)] = value.map((item) => {
        // if the item is an object, recurse on it
        if (Object.prototype.toString.call(item) === '[object Object]') {
          return removeListFromPropertyNames(item);
        }
        // otherwise, return the item as-is
        return item;
      });
    } else {
      result[key] = value;
    }
  }
  return result;
}
