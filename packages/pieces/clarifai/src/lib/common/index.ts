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
    auth: ReqInfo;
    modelId: string;
    modelVersionId?: string;
    latestVersion: boolean;
    input: string;
}

export function callClarifaiModel({ auth, modelId, modelVersionId, latestVersion, input }: CallModelRequest) {
    const req = new PostModelOutputsRequest();
    req.setUserAppId(userAppIdSet(auth));
    req.setModelId(modelId);
    if (!latestVersion) {
        if (!modelVersionId) {
            throw new Error('Must specify either latestVersion or modelVersionId');
        }
        else {
            req.setVersionId(modelVersionId);
        }
    }
    req.setInputsList([createImageInput(input)])

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

function userAppIdSet(auth: ReqInfo) {
    const set = new UserAppIDSet();
    set.setUserId(auth[1]);
    set.setAppId(auth[2]);
    return set;
}

function authMetadata(auth: ReqInfo) {
    const metadata = new grpc.Metadata();
    metadata.set("authorization", "Key " + auth[0]);
    return metadata;
}

export const CommonClarifaiProps = {
    userId: Property.ShortText({
        description: 'User ID of the owner of the model',
        displayName: 'User ID',
        required: true,
    }),
    appId: Property.ShortText({
        description: 'ID of the app the model belongs to',
        displayName: 'App ID',
        required: true,
    }),
};
