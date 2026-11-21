import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { joggAi } from '../src/index';
import { aiCreateAvatarVideo } from '../src/lib/actions/ai/create-avatar-video-ai';
import { aiCreatePhotoAvatar } from '../src/lib/actions/ai/create-photo-avatar';
import { aiCreateTemplateVideo } from '../src/lib/actions/ai/create-template-video';
import { aiGetAvatarVideo } from '../src/lib/actions/ai/get-avatar-video';
import { aiGetPhotoAvatarStatus } from '../src/lib/actions/ai/get-photo-avatar-status';
import { aiGetRemainingQuota } from '../src/lib/actions/ai/get-remaining-quota';
import { aiGetTemplate } from '../src/lib/actions/ai/get-template';
import { aiGetTemplateVideo } from '../src/lib/actions/ai/get-template-video';
import { aiListCustomAvatars } from '../src/lib/actions/ai/list-custom-avatars';
import { aiListPhotoAvatars } from '../src/lib/actions/ai/list-photo-avatars';
import { aiListPublicAvatars } from '../src/lib/actions/ai/list-public-avatars';
import { aiListTemplates } from '../src/lib/actions/ai/list-templates';
import { aiListVoices } from '../src/lib/actions/ai/list-voices';
import { aiUpdateProduct } from '../src/lib/actions/ai/update-product';

function run({ action, props }: { action: { run: unknown }; props: Record<string, unknown> }): Promise<unknown> {
  const fn = action.run;
  if (typeof fn !== 'function') throw new Error('not a function');
  return Promise.resolve(Reflect.apply(fn, action, [{ auth: { secret_text: 'k' }, propsValue: props }]));
}

function mockByPath({ responses }: { responses: Record<string, unknown> }) {
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    const path = new URL(request.url).pathname;
    return { status: 200, headers: {}, body: { code: 0, msg: 'Success', data: responses[path] ?? {} } };
  });
}

function sent({ spy, index = 0 }: { spy: ReturnType<typeof mockByPath>; index?: number }) {
  const request = spy.mock.calls[index][0];
  return { method: request.method, path: new URL(request.url).pathname, body: request.body, query: request.queryParams };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ai actions', () => {
  it('are all registered with audience ai', () => {
    const ai = Object.values(joggAi.actions()).filter((action) => action.name.startsWith('ai_'));
    expect(ai).toHaveLength(15);
    expect(ai.every((action) => action.audience === 'ai')).toBe(true);
  });

  it('get remaining quota', async () => {
    const spy = mockByPath({ responses: { '/v2/user/remaining_quota': { remaining_quota: 200 } } });
    expect(await run({ action: aiGetRemainingQuota, props: {} })).toEqual({ remaining_quota: 200 });
    expect(sent({ spy })).toMatchObject({ method: HttpMethod.GET, path: '/v2/user/remaining_quota' });
  });

  it('create avatar video builds the nested v2 body', async () => {
    const spy = mockByPath({ responses: { '/v2/create_video_from_avatar': { video_id: 'vd_1' } } });
    const out = await run({
      action: aiCreateAvatarVideo,
      props: { avatar_id: '1784', avatar_type: 'public', voice_id: ' v1 ', script: 'Hi', screen_style: 'split', caption: 'no' },
    });
    expect(out).toEqual({ video_id: 'vd_1' });
    expect(sent({ spy })).toEqual({
      method: HttpMethod.POST,
      path: '/v2/create_video_from_avatar',
      query: undefined,
      body: {
        avatar: { avatar_type: 0, avatar_id: 1784 },
        voice: { type: 'script', script: 'Hi', voice_id: 'v1' },
        aspect_ratio: 'portrait',
        screen_style: 2,
        caption: false,
      },
    });
  });

  it('create avatar video uses audio and custom avatar', async () => {
    const spy = mockByPath({ responses: {} });
    await run({ action: aiCreateAvatarVideo, props: { avatar_id: '5', avatar_type: 'custom', voice_id: 'v', audio_url: 'https://a/b.mp3' } });
    expect(sent({ spy }).body).toMatchObject({
      avatar: { avatar_type: 1, avatar_id: 5 },
      voice: { type: 'audio', audio_url: 'https://a/b.mp3', voice_id: 'v' },
      screen_style: 1,
    });
  });

  it('create avatar video rejects both or neither script and audio, and non-numeric avatar ids', async () => {
    const spy = mockByPath({ responses: {} });
    await expect(run({ action: aiCreateAvatarVideo, props: { avatar_id: '1', voice_id: 'v' } })).rejects.toThrow('exactly one');
    await expect(
      run({ action: aiCreateAvatarVideo, props: { avatar_id: '1', voice_id: 'v', script: 's', audio_url: 'https://a' } })
    ).rejects.toThrow('exactly one');
    await expect(run({ action: aiCreateAvatarVideo, props: { avatar_id: 'Zoe', voice_id: 'v', script: 's' } })).rejects.toThrow(
      'Avatar ID must be a numeric'
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('get avatar video and get template video use path ids', async () => {
    const spy = mockByPath({ responses: { '/v2/avatar_video/vd_1': { video_id: 'vd_1', status: 'completed' } } });
    expect(await run({ action: aiGetAvatarVideo, props: { video_id: ' vd_1 ' } })).toEqual({ video_id: 'vd_1', status: 'completed' });
    await run({ action: aiGetTemplateVideo, props: { video_id: 'tv_2' } });
    expect(sent({ spy })).toMatchObject({ method: HttpMethod.GET, path: '/v2/avatar_video/vd_1' });
    expect(sent({ spy, index: 1 })).toMatchObject({ method: HttpMethod.GET, path: '/v2/template_video/tv_2' });
  });

  it('get photo avatar status passes null lists through', async () => {
    const data = { photo_id: 'ph_1', status: 'success', msg: null, image_url_list: null, image_key_list: null };
    const spy = mockByPath({ responses: { '/v2/photo_avatar/photo': data } });
    expect(await run({ action: aiGetPhotoAvatarStatus, props: { photo_id: 'ph_1' } })).toEqual(data);
    expect(sent({ spy })).toMatchObject({ method: HttpMethod.GET, path: '/v2/photo_avatar/photo', query: { photo_id: 'ph_1' } });
  });

  it('create photo avatar sends v2 body with defaults and drops empty optionals', async () => {
    const spy = mockByPath({ responses: { '/v2/photo_avatar/photo/generate': { photo_id: 'ph_9' } } });
    const out = await run({
      action: aiCreatePhotoAvatar,
      props: { age: 'Adult', gender: 'Female', avatar_style: 'Social', model: 'modern', appearance: ' glasses ', background: '' },
    });
    expect(out).toEqual({ photo_id: 'ph_9' });
    expect(sent({ spy })).toMatchObject({
      method: HttpMethod.POST,
      path: '/v2/photo_avatar/photo/generate',
      body: { age: 'Adult', gender: 'Female', avatar_style: 'Social', model: 'modern', aspect_ratio: 'portrait', appearance: 'glasses' },
    });
    expect(sent({ spy }).body).not.toHaveProperty('background');
  });

  it('update product sends PUT with only given fields and requires one', async () => {
    const spy = mockByPath({ responses: {} });
    expect(await run({ action: aiUpdateProduct, props: { product_id: ' P1 ', name: 'Mug' } })).toEqual({ product_id: 'P1' });
    expect(sent({ spy })).toMatchObject({ method: HttpMethod.PUT, path: '/v2/product', body: { product_id: 'P1', name: 'Mug' } });
    await expect(run({ action: aiUpdateProduct, props: { product_id: 'P1' } })).rejects.toThrow('at least one field');
  });

  it('list public avatars sends paging and filters', async () => {
    const spy = mockByPath({ responses: { '/v2/avatars/public': { avatars: [{ id: 1784, name: 'Zoe' }] } } });
    const out = await run({ action: aiListPublicAvatars, props: { page: 2, page_size: 500, gender: 'female', age: undefined } });
    expect(out).toEqual({ avatars: [{ id: 1784, name: 'Zoe' }] });
    expect(sent({ spy })).toEqual({
      method: HttpMethod.GET,
      path: '/v2/avatars/public',
      body: undefined,
      query: { page: '2', page_size: '100', gender: 'female' },
    });
  });

  it('list custom and photo avatars hit their own paths', async () => {
    const spy = mockByPath({ responses: {} });
    expect(await run({ action: aiListCustomAvatars, props: { status: 'completed' } })).toEqual({ avatars: [] });
    await run({ action: aiListPhotoAvatars, props: { name: 'me' } });
    expect(sent({ spy })).toMatchObject({ path: '/v2/avatars/custom', query: { page: '1', page_size: '20', status: 'completed' } });
    expect(sent({ spy, index: 1 })).toMatchObject({ path: '/v2/avatars/photo_avatars', query: { name: 'me' } });
  });

  it('list voices puts custom voices first on page 1 and reports has_more', async () => {
    const spy = mockByPath({
      responses: {
        '/v2/voices': { voices: [{ voice_id: 'p1' }], has_more: true },
        '/v2/voices/custom': { voices: [{ voice_id: 'c1' }] },
      },
    });
    const out = await run({ action: aiListVoices, props: { language: 'english' } });
    expect(out).toEqual({
      voices: [
        { voice_id: 'c1', is_custom: true },
        { voice_id: 'p1', is_custom: false },
      ],
      has_more: true,
    });
    const paths = spy.mock.calls.map((call) => new URL(call[0].url).pathname).sort();
    expect(paths).toEqual(['/v2/voices', '/v2/voices/custom']);
  });

  it('list voices skips custom voices after page 1 or when disabled', async () => {
    const spy = mockByPath({ responses: { '/v2/voices': { voices: [{ voice_id: 'p2' }] } } });
    const page2 = await run({ action: aiListVoices, props: { page: 2 } });
    await run({ action: aiListVoices, props: { include_custom: 'no' } });
    expect(page2).toEqual({ voices: [{ voice_id: 'p2', is_custom: false }], has_more: false });
    expect(spy.mock.calls.every((call) => new URL(call[0].url).pathname === '/v2/voices')).toBe(true);
  });

  it('list templates falls back from template_id to id', async () => {
    const spy = mockByPath({
      responses: { '/v2/templates/custom': { templates: [{ id: 7, name: 'A' }, { template_id: 8, name: 'B' }] } },
    });
    const out = await run({ action: aiListTemplates, props: { aspect_ratio: 'portrait' } });
    expect(out).toEqual({
      templates: [
        { id: 7, name: 'A', template_id: 7 },
        { template_id: 8, name: 'B' },
      ],
    });
    expect(sent({ spy })).toMatchObject({ method: HttpMethod.GET, path: '/v2/templates/custom', query: { aspect_ratio: 'portrait' } });
  });

  it('get template uses the numeric id path', async () => {
    const spy = mockByPath({ responses: {} });
    await run({ action: aiGetTemplate, props: { template_id: ' 42 ' } });
    expect(sent({ spy })).toMatchObject({ method: HttpMethod.GET, path: '/v2/template/custom/42' });
    await expect(run({ action: aiGetTemplate, props: { template_id: 'x' } })).rejects.toThrow('Template ID must be a numeric');
  });
});

describe('create template video variables', () => {
  const base = { template_id: '12', voice_language: 'english' };

  it('accepts an array and maps content and url properties', async () => {
    const spy = mockByPath({ responses: { '/v2/create_video_with_template': { video_id: 'tv_1' } } });
    const out = await run({
      action: aiCreateTemplateVideo,
      props: {
        ...base,
        variables: [
          { type: 'text', name: ' title ', content: 'Hello' },
          { type: 'image', name: 'logo', url: 'https://h/l.png' },
        ],
        avatar_id: '3',
        captions: 'yes',
      },
    });
    expect(out).toEqual({ video_id: 'tv_1' });
    expect(sent({ spy })).toEqual({
      method: HttpMethod.POST,
      path: '/v2/create_video_with_template',
      query: undefined,
      body: {
        template_id: 12,
        voice_language: 'english',
        variables: [
          { type: 'text', name: 'title', properties: { content: 'Hello' } },
          { type: 'image', name: 'logo', properties: { url: 'https://h/l.png' } },
        ],
        avatar_id: 3,
        avatar_type: 0,
        captions_enabled: true,
      },
    });
  });

  it('accepts a JSON string and a single object', async () => {
    const spy = mockByPath({ responses: {} });
    await run({ action: aiCreateTemplateVideo, props: { ...base, variables: '[{"type":"script","name":"s","content":"Hi"}]' } });
    await run({ action: aiCreateTemplateVideo, props: { ...base, variables: { type: 'video', name: 'v', url: 'https://h/v.mp4' } } });
    expect(sent({ spy }).body).toMatchObject({ variables: [{ type: 'script', name: 's', properties: { content: 'Hi' } }] });
    expect(sent({ spy, index: 1 }).body).toMatchObject({ variables: [{ type: 'video', name: 'v', properties: { url: 'https://h/v.mp4' } }] });
  });

  it('rejects invalid variables before calling JoggAI', async () => {
    const spy = mockByPath({ responses: {} });
    const cases: [unknown, string][] = [
      ['not json', 'Variables must be valid JSON.'],
      [[], 'non-empty list'],
      [['x'], 'Variable 1 must be an object'],
      [[{ type: 'audio', name: 'a' }], 'Variable 1 type must be one of'],
      [[{ type: 'text', name: ' ' }], 'Variable 1 needs a name.'],
      [[{ type: 'text', name: 't' }], 'Variable "t" needs content.'],
      [[{ type: 'image', name: 'i', content: 'x' }], 'Variable "i" needs a url.'],
    ];
    for (const [variables, message] of cases) {
      await expect(run({ action: aiCreateTemplateVideo, props: { ...base, variables } })).rejects.toThrow(message);
    }
    expect(spy).not.toHaveBeenCalled();
  });
});
