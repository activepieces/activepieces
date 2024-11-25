import { Property, ApFile } from '@activepieces/pieces-framework';
import { grpc } from 'clarifai-nodejs-grpc';
import {
  Model,
  Data,
  Input,
  UserAppIDSet,
  Image,
  Video,
  Audio,
  Text,
} from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';
import { V2Client } from 'clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb';
import {
  MultiOutputResponse,
  PostModelOutputsRequest,
  MultiInputResponse,
  PostInputsRequest,
  PostWorkflowResultsResponse,
  PostWorkflowResultsRequest,
} from 'clarifai-nodejs-grpc/proto/clarifai/api/service_pb';
import { promisify } from 'util';

function initClarifaiClient() {
  const clarifai = new V2Client(
    'api.clarifai.com',
    grpc.ChannelCredentials.createSsl()
  );
  return clarifai;
}

export const clarifaiClient = initClarifaiClient();

export interface CallModelRequest {
  auth: string;
  modelUrl: string;
  input: Input;
}

export interface CallWorkflowRequest {
  auth: string;
  workflowUrl: string;
  input: Input;
}

export interface CallPostInputsRequest {
  auth: string;
  userId: string;
  appId: string;
  input: Input;
}

export function callClarifaiModel({ auth, modelUrl, input }: CallModelRequest) {
  const [userId, appId, modelId, versionId] = parseEntityUrl(modelUrl);

  const req = new PostModelOutputsRequest();
  req.setUserAppId(userAppIdSet(userId, appId));
  req.setModelId(modelId);
  if (versionId) {
    req.setVersionId(versionId);
  }
  req.setInputsList([input]);

  const metadata = authMetadata(auth);
  // TODO: we should really be using the async version of this, circle back with clarifai team to see if we can
  // tweak the protoc settings to build a promise-compatible version of our API client.
  const postModelOutputs = promisify<
    PostModelOutputsRequest,
    grpc.Metadata,
    MultiOutputResponse
  >(clarifaiClient.postModelOutputs.bind(clarifaiClient));
  return postModelOutputs(req, metadata);
}

export function callClarifaiWorkflow({
  auth,
  workflowUrl,
  input,
}: CallWorkflowRequest) {
  const [userId, appId, workflowId, versionId] = parseEntityUrl(workflowUrl);

  const req = new PostWorkflowResultsRequest();
  req.setUserAppId(userAppIdSet(userId, appId));
  req.setWorkflowId(workflowId);
  if (versionId) {
    req.setVersionId(versionId);
  }
  req.setInputsList([input]);

  const metadata = authMetadata(auth);
  // TODO: we should really be using the async version of this, circle back with clarifai team to see if we can
  // tweak the protoc settings to build a promise-compatible version of our API client.
  const postWorkflowResults = promisify<
    PostWorkflowResultsRequest,
    grpc.Metadata,
    PostWorkflowResultsResponse
  >(clarifaiClient.postWorkflowResults.bind(clarifaiClient));
  return postWorkflowResults(req, metadata);
}

export function callPostInputs({
  auth,
  userId,
  appId,
  input,
}: CallPostInputsRequest) {
  const req = new PostInputsRequest();
  req.setUserAppId(userAppIdSet(userId, appId));
  req.setInputsList([input]);

  const metadata = authMetadata(auth);
  // TODO: we should really be using the async version of this, circle back with clarifai team to see if we can
  // tweak the protoc settings to build a promise-compatible version of our API client.
  const postInputs = promisify<
    PostInputsRequest,
    grpc.Metadata,
    MultiInputResponse
  >(clarifaiClient.postInputs.bind(clarifaiClient));
  return postInputs(req, metadata);
}

export function fileToInput(file: ApFile) {
  const input = new Input();
  const inputData = new Data();

  const base64 = file.base64;
  const mimeType = detectMimeType(base64, file.filename);
  if (mimeType.startsWith('image')) {
    const dataImage = new Image();
    dataImage.setBase64(base64);
    inputData.setImage(dataImage);
  } else if (mimeType.startsWith('video')) {
    const dataVideo = new Video();
    dataVideo.setBase64(base64);
    inputData.setVideo(dataVideo);
  } else if (mimeType.startsWith('audio')) {
    const dataAudio = new Audio();
    dataAudio.setBase64(base64);
    inputData.setAudio(dataAudio);
  } else {
    // sending the rest of text may not always work, but it's worth a shot
    const dataText = new Text();
    dataText.setRaw(base64);
    inputData.setText(dataText);
  }
  input.setData(inputData);
  return input;
}

export function textToInput(text: string) {
  const input = new Input();
  const inputData = new Data();
  const dataText = new Text();
  dataText.setRaw(text);
  inputData.setText(dataText);
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
  metadata.set('authorization', 'Key ' + auth);
  return metadata;
}

export const CommonClarifaiProps = {
  modelUrl: Property.ShortText({
    description:
      'URL of the Clarifai model. For example https://clarifai.com/clarifai/main/models/general-image-recognition OR a specific version such as https://clarifai.com/clarifai/main/models/general-image-recognition/versions/aa7f35c01e0642fda5cf400f543e7c40. Find more models at https://clarifai.com/explore/models',
    displayName: 'Model URL',
    required: true,
  }),
  workflowUrl: Property.ShortText({
    description:
      'URL of the Clarifai workflow. For example https://clarifai.com/clarifai/main/workflows/Demographics. Find more workflows at https://clarifai.com/explore/workflows',
    displayName: 'Workflow URL',
    required: true,
  }),
};

function parseEntityUrl(entityUrl: string): [string, string, string, string] {
  const url = new URL(entityUrl);
  const parts = url.pathname.split('/');
  let version = '';
  if (parts.length === 7 && parts[5] === 'versions') {
    version = parts[6];
  }
  return [parts[1], parts[2], parts[4], version];
}

export function removeListFromPropertyNames(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.endsWith('List') && Array.isArray(value)) {
      if (value.length === 0) {
        // remove empty lists by default
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
      // if the item is an object, recurse on it
      if (Object.prototype.toString.call(value) === '[object Object]') {
        result[key] = removeListFromPropertyNames(
          value as Record<string, unknown>
        );
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Returns the data type based on the base64 string and filename extension
 * https://www.iana.org/assignments/media-types/media-types.xhtml for full list of mime types.
 * @param {String} base64String
 * @param {String} fileName
 * @returns {String}
 */
function detectMimeType(base64String: string, fileName: string | undefined) {
  let ext = 'undefined';
  if (fileName === undefined || fileName === null || fileName === '') {
    ext = 'bin';
  } else {
    ext = fileName.substring(fileName.lastIndexOf('.') + 1);
    if (ext === undefined || ext === null || ext === '') ext = 'bin';
  }
  ext = ext.toLowerCase();
  // This is not an exhaustive list by any stretch.
  const signatures = {
    JVBERi0: 'application/pdf',
    R0lGODdh: 'image/gif',
    R0lGODlh: 'image/gif',
    iVBORw0KGgo: 'image/png',
    TU0AK: 'image/tiff',
    '/9j/': 'image/jpg',
    UEs: 'application/vnd.openxmlformats-officedocument.',
    PK: 'application/zip',
  };
  for (const [key, value] of Object.entries(signatures)) {
    let modiifedValue = value;
    if (base64String.indexOf(key) === 0) {
      // var x = signatures[s];
      // if an office file format
      if (ext.length > 3 && ext.substring(0, 3) === 'ppt') {
        modiifedValue += 'presentationml.presentation';
      } else if (ext.length > 3 && ext.substring(0, 3) === 'xls') {
        modiifedValue += 'spreadsheetml.sheet';
      } else if (ext.length > 3 && ext.substring(0, 3) === 'doc') {
        modiifedValue += 'wordprocessingml.document';
      }
      // return
      return modiifedValue;
    }
  }
  // if we are here we can only go off the extensions
  const extensions = {
    '7z': 'application/x-7z-compressed',
    aif: 'audio/x-aiff',
    aiff: 'audio/x-aiff',
    asf: 'video/x-ms-asf',
    asx: 'video/x-ms-asf',
    avi: 'video/x-msvideo',
    bin: 'application/octet-stream',
    bmp: 'image/bmp',
    class: 'application/octet-stream',
    css: 'text/css',
    csv: 'text/csv',
    dll: 'application/octet-stream',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    dwg: 'application/acad',
    dxf: 'application/dxf',
    eml: 'message/rfc822',
    exe: 'application/octet-stream',
    flv: 'video/x-flv',
    gif: 'image/gif',
    gz: 'application/x-gzip',
    gzip: 'application/x-gzip',
    htm: 'text/html',
    html: 'text/html',
    ice: 'x-conference/x-cooltalk',
    ico: 'image/x-icon',
    ics: 'text/calendar',
    iges: 'model/iges',
    igs: 'model/iges',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    js: 'application/javascript',
    json: 'application/json',
    m2a: 'audio/mpeg',
    m2v: 'video/mpeg',
    m3u: 'audio/x-mpegurl',
    m4v: 'video/mpeg',
    mesh: 'model/mesh',
    mov: 'video/quicktime',
    movie: 'video/x-sgi-movie',
    mp2: 'audio/mpeg',
    mp2a: 'audio/mpeg',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    mpe: 'video/mpeg',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    mpga: 'audio/mpeg',
    mpv: 'video/mpeg',
    msg: 'application/vnd.ms-outlook',
    msh: 'model/mesh',
    mxf: 'application/mxf',
    obj: 'application/octet-stream',
    oda: 'application/oda',
    ogg: 'application/ogg',
    ogv: 'video/ogg',
    ogx: 'application/ogg',
    pdb: 'chemical/x-pdb',
    pdf: 'application/pdf',
    png: 'image/png',
    ppt: 'application/vnd.ms-powerpoint',
    psd: 'application/octet-stream',
    qt: 'video/quicktime',
    ra: 'audio/x-realaudio',
    ram: 'audio/x-pn-realaudio',
    rgb: 'image/x-rgb',
    rm: 'audio/x-pn-realaudio',
    rpm: 'audio/x-pn-realaudio-plugin',
    rtf: 'application/rtf',
    sea: 'application/octet-stream',
    silo: 'model/mesh',
    so: 'application/octet-stream',
    svg: 'image/svg+xml',
    tar: 'application/x-tar',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    txt: 'text/plain',
    vrml: 'model/vrml',
    wav: 'audio/x-wav',
    wax: 'audio/x-ms-wax',
    webp: 'image/webp',
    wma: 'audio/x-ms-wma',
    wmv: 'video/x-ms-wmv',
    wrl: 'model/vrml',
    xls: 'application/vnd.ms-excel',
    xml: 'text/xml',
    xyz: 'chemical/x-pdb',
    zip: 'application/zip',
  };
  for (const [key, value] of Object.entries(extensions)) {
    if (ext.indexOf(key) === 0) {
      return value;
    }
  }
  // if we are here - not sure what type this is
  return 'unknown';
}

export function cleanMultiOutputResponse(outputs: MultiOutputResponse) {
  if (outputs.getOutputsList().length === 0) {
    throw new Error('No outputs found from Clarifai');
  }
  const data = outputs.getOutputsList()[0].getData();
  if (data == undefined) {
    throw new Error('No data found from Clarifai');
  } else {
    const result = Data.toObject(false, data);
    return removeListFromPropertyNames(result);
  }
}

export function cleanMultiInputResponse(inputs: MultiInputResponse) {
  if (inputs.getInputsList().length === 0) {
    throw new Error('No inputs found from Clarifai');
  }
  const data = inputs.getInputsList()[0].getData();
  if (data == undefined) {
    throw new Error('No data found from Clarifai');
  } else {
    const result = Data.toObject(false, data);
    return removeListFromPropertyNames(result);
  }
}

export function cleanPostWorkflowResultsResponse(
  response: PostWorkflowResultsResponse
) {
  if (response.getResultsList().length === 0) {
    throw new Error('No results found from Clarifai');
  }
  // one result per input in the workflow.
  const results = response.getResultsList();
  if (results == undefined || results.length === 0) {
    throw new Error('No results found from Clarifai');
  } else {
    const result = results[0];
    const outputs = result.getOutputsList();
    if (outputs == undefined || outputs.length === 0) {
      throw new Error('No outputs found from Clarifai');
    }
    const array: any[] = [];
    for (const output of outputs) {
      const model = output.getModel();
      if (model == undefined) {
        throw new Error('No model found from Clarifai');
      }
      const m = Model.toObject(false, model);
      const data = output.getData();
      let out: any = { output: 'suppressed' };
      if (data != undefined) {
        out = Data.toObject(false, data);
      }
      array.push({
        model: removeListFromPropertyNames(m),
        data: removeListFromPropertyNames(out),
      });
    }
    return array;
  }
}
