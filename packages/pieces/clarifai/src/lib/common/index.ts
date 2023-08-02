import { Property } from '@activepieces/pieces-framework';
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

/**
 * A tuple of `[API Key, User ID, App ID]`, useful for passing around authentication
 * info for Clarifai.
 */
export type ReqInfo = readonly [string, string, string];

export interface CallModelRequest {
    auth: string;
    modelUrl: string;
    inputUrl: string;
}

export function callClarifaiModel({ auth, modelUrl, inputUrl }: CallModelRequest) {
    const [userId, appId, modelId] = parseEntityUrl(modelUrl);

    const req = new PostModelOutputsRequest();
    req.setUserAppId(userAppIdSet(userId, appId));
    req.setModelId(modelId);
    req.setInputsList([createImageInput(inputUrl)])

    const metadata = authMetadata(auth);
    // TODO: we should really be using the async version of this, circle back with clarifai team to see if we can
    // tweak the protoc settings to build a promise-compatible version of our API client.
    const postModelOutputs = promisify<PostModelOutputsRequest, grpc.Metadata, MultiOutputResponse>(clarifaiClient.postModelOutputs.bind(clarifaiClient));
    return postModelOutputs(req, metadata);
}

function createImageInput(url: string) {
    const input = new Input();
    const inputData = new Data();
    const dataImage = new Image();
    dataImage.setUrl(url);
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
    metadata.set("authorization", "Key " + auth[0]);
    return metadata;
}

export const CommonClarifaiProps = {
    modelUrl: Property.ShortText({
        description: 'URL of the Clarifai model',
        displayName: 'Model URL',
        required: true,
    }),
};

function parseEntityUrl(entityUrl: string): [string, string, string] {
    const url = new URL(entityUrl);
    const parts = url.pathname.split('/')
    return [parts[0], parts[1], parts[3]];
}
