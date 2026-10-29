import {afterEach, expect, test} from 'bun:test';
import {httpClient} from '@activepieces/pieces-common';
import {startStoryboard} from './src/lib/actions/start-storyboard';
import {getStatus} from './src/lib/actions/get-status';
import {getAccount} from './src/lib/actions/get-account';
const original = httpClient.sendRequest;
const auth = {secret_text: 'synthetic-test-key'};
afterEach(() => {httpClient.sendRequest = original;});
test('credit guard prevents a request', async () => {
  let called = false;
  httpClient.sendRequest = async () => {called = true; return {body: {}};};
  await expect(startStoryboard.run({auth, propsValue:{approve:false, scenes:['A product']}})).rejects.toMatchObject({code:'CREDIT_APPROVAL_REQUIRED'});
  expect(called).toBe(false);
});
test('storyboard sends the API contract once without retries', async () => {
  const requests = [];
  httpClient.sendRequest = async (request) => {requests.push(request); return {body:{workflowRunId:'synthetic-run'}};};
  const result = await startStoryboard.run({auth, propsValue:{approve:true,scenes:['Product close-up','Product in use']}});
  expect(result).toEqual({workflowRunId:'synthetic-run'});
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({method:'POST',retries:0,body:{quality:'HIGH',autoExport:true,scenes:[{prompt:'Product close-up'},{prompt:'Product in use'}],remixActions:[{type:'ENABLE_CAPTIONS'},{type:'CONVERT_IMAGES_TO_VIDEOS'}]}});
});
test('status preserves downloadUrl and does not create a workflow', async () => {
  httpClient.sendRequest = async (request) => {expect(request.method).toBe('GET');expect(request.url).toEndWith('/workflows/runs/synthetic-run');return {body:{status:'SUCCEEDED',downloadUrl:'https://example.com/video.mp4'}};};
  expect(await getStatus.run({auth,propsValue:{workflowRunId:'synthetic-run'}})).toHaveProperty('downloadUrl','https://example.com/video.mp4');
});
test('account reads the connected account', async () => {
  httpClient.sendRequest = async (request) => {expect(request.url).toBe('https://api.videogen.io/v1/account/me');return {body:{email:'test@example.com'}};};
  expect(await getAccount.run({auth})).toEqual({email:'test@example.com'});
});
