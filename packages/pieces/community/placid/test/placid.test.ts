import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, AppConnectionValueForAuthProperty, InputPropertyMap, StaticPropsValue } from '@activepieces/pieces-framework';
import { createMockActionContext } from '../../../framework/src/lib/test';
import { placid } from '../src';
import { placidAuth } from '../src/lib/auth';
import { createImage } from '../src/lib/actions/create-image';
import { createPdf } from '../src/lib/actions/create-pdf';
import { createVideo } from '../src/lib/actions/create-video';
import { getImage } from '../src/lib/actions/get-image';
import { getPdf } from '../src/lib/actions/get-pdf';
import { getVideo } from '../src/lib/actions/get-video';
import { convertFileToUrl } from '../src/lib/actions/convert-file-to-url';
import { listTemplatesAi } from '../src/lib/actions/list-templates-ai';
import { getTemplateAi } from '../src/lib/actions/get-template-ai';
import { listCollectionsAi } from '../src/lib/actions/list-collections-ai';
import { createImageAi } from '../src/lib/actions/create-image-ai';
import { createPdfAi } from '../src/lib/actions/create-pdf-ai';
import { createVideoAi } from '../src/lib/actions/create-video-ai';
import { deleteImageAi } from '../src/lib/actions/delete-image-ai';
import { deletePdfAi } from '../src/lib/actions/delete-pdf-ai';
import { deleteVideoAi } from '../src/lib/actions/delete-video-ai';

const BASE = 'https://api.placid.app/api/rest';

const auth: AppConnectionValueForAuthProperty<typeof placidAuth> = {
	type: AppConnectionType.SECRET_TEXT,
	secret_text: 'test-token',
};

const template = {
	uuid: 'tpl-1',
	title: 'Card',
	width: 600,
	height: 315,
	tags: ['ap-test'],
	layers: [
		{ name: 'title', type: 'text' },
		{ name: 'photo', type: 'picture' },
	],
};

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

function context<Props extends InputPropertyMap>({ propsValue }: { propsValue: StaticPropsValue<Props> }) {
	return { ...createMockActionContext<Props>({ propsValue }), auth };
}

function httpError({ status, body }: { status: number; body: unknown }): HttpError {
	return new HttpError({}, { status, responseBody: body });
}

function mockRoutes({ routes }: { routes: ((request: HttpRequest) => unknown)[] }) {
	let index = 0;
	return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
		const route = routes[Math.min(index, routes.length - 1)];
		index += 1;
		const result = route(request);
		if (result instanceof Error) {
			throw result;
		}
		return { status: 200, headers: {}, body: result };
	});
}

function requestAt({ spy, index }: { spy: ReturnType<typeof mockRoutes>; index: number }): HttpRequest {
	return spy.mock.calls[index][0];
}

const imageDefaults = { layers: {}, outputDpi: undefined, outputFilename: undefined, webhook_success: undefined, create_now: undefined, passthrough: undefined };
const videoDefaults = { layers: {}, outputFps: undefined, outputFilename: undefined, webhook_success: undefined, create_now: undefined, passthrough: undefined };
const imageAiDefaults = { layers: undefined, width: undefined, height: undefined, filename: undefined, image_format: undefined, dpi: undefined, color_mode: undefined, passthrough: undefined, wait_for_result: undefined };
const pdfAiDefaults = { filename: undefined, image_quality: undefined, dpi: undefined, color_mode: undefined, passthrough: undefined, wait_for_result: undefined };
const videoAiDefaults = { width: undefined, height: undefined, fps: undefined, filename: undefined, passthrough: undefined, wait_for_result: undefined };
const listDefaults = { title_filter: undefined, tag: undefined, collection_id: undefined, order_by: undefined, limit: undefined };

describe('piece', () => {
	it('registers every action with the expected audience', () => {
		const actions = placid.actions();
		expect(Object.keys(actions).sort()).toEqual(
			[
				'convert_file_to_url',
				'create_image',
				'create_image_ai',
				'create_pdf',
				'create_pdf_ai',
				'create_video',
				'create_video_ai',
				'custom_api_call',
				'delete_image_ai',
				'delete_pdf_ai',
				'delete_video_ai',
				'get_image',
				'get_pdf',
				'get_template_ai',
				'get_video',
				'list_collections_ai',
				'list_templates_ai',
			].sort(),
		);
		expect([createImage, createPdf, createVideo].map((action) => action.audience)).toEqual(['human', 'human', 'human']);
		expect([getImage, getPdf, getVideo, convertFileToUrl].map((action) => action.audience)).toEqual(['both', 'both', 'both', 'both']);
		for (const action of Object.values(actions)) {
			if (action.name !== 'custom_api_call') {
				expect(action.outputSchema, action.name).toBeDefined();
			}
		}
	});
});

describe('human create actions', () => {
	it('Create Image flattens dynamic layers and posts to /images', async () => {
		const spy = mockRoutes({ routes: [() => ({ id: 1, status: 'queued' })] });
		await createImage.run(
			context<typeof createImage.props>({
				propsValue: {
					...imageDefaults,
					webhook_success: undefined,
					template: 'tpl-1',
					layers: { 'title:::text': 'Hi', 'title:::font': '', 'photo:::image': 'https://x/a.png' },
					outputDpi: 72,
					outputFilename: 'out.png',
					passthrough: 'p',
					create_now: false,
				},
			}),
		);
		const request = requestAt({ spy, index: 0 });
		expect(request.method).toBe(HttpMethod.POST);
		expect(request.url).toBe(`${BASE}/images`);
		expect(request.body).toEqual({
			template_uuid: 'tpl-1',
			layers: { title: { text: 'Hi' }, photo: { image: 'https://x/a.png' } },
			create_now: false,
			passthrough: 'p',
			modifications: { filename: 'out.png', dpi: 72 },
		});
	});

	it('Create PDF posts one page to /pdfs', async () => {
		const spy = mockRoutes({ routes: [() => ({ id: 2, status: 'queued' })] });
		await createPdf.run(context<typeof createPdf.props>({ propsValue: { ...imageDefaults, template: 'tpl-1', outputDpi: 96 } }));
		const request = requestAt({ spy, index: 0 });
		expect(request.method).toBe(HttpMethod.POST);
		expect(request.url).toBe(`${BASE}/pdfs`);
		expect(request.body).toEqual({ pages: [{ template_uuid: 'tpl-1' }], modifications: { dpi: 96 } });
	});

	it('Create Video posts one clip to /videos', async () => {
		const spy = mockRoutes({ routes: [() => ({ id: 3, status: 'queued' })] });
		await createVideo.run(
			context<typeof createVideo.props>({ propsValue: { ...videoDefaults, template: 'tpl-1', layers: { 'clip:::video': 'https://x/v.mp4' }, outputFps: 25 } }),
		);
		const request = requestAt({ spy, index: 0 });
		expect(request.url).toBe(`${BASE}/videos`);
		expect(request.body).toEqual({
			clips: [{ template_uuid: 'tpl-1', layers: { clip: { video: 'https://x/v.mp4' } } }],
			modifications: { fps: 25 },
		});
	});
});

describe('get actions', () => {
	it('Get Image, Get PDF and Get Video are GETs on their render paths', async () => {
		const spy = mockRoutes({ routes: [() => ({ id: 1, status: 'finished' })] });
		await getImage.run(context<typeof getImage.props>({ propsValue: { imageId: '5' } }));
		await getPdf.run(context<typeof getPdf.props>({ propsValue: { pdfId: '6' } }));
		await getVideo.run(context<typeof getVideo.props>({ propsValue: { videoId: '7' } }));
		expect([0, 1, 2].map((index) => requestAt({ spy, index }).url)).toEqual([`${BASE}/images/5`, `${BASE}/pdfs/6`, `${BASE}/videos/7`]);
		for (const index of [0, 1, 2]) {
			expect(requestAt({ spy, index })).toMatchObject({ method: HttpMethod.GET, authentication: { token: 'test-token' } });
		}
	});

	it('maps 404 to a not-found message and keeps the vendor body in responseBody', async () => {
		mockRoutes({ routes: [() => httpError({ status: 404, body: { message: 'Not Found' } })] });
		const run = getImage.run(context<typeof getImage.props>({ propsValue: { imageId: '9' } }));
		await expect(run).rejects.toMatchObject({ message: expect.stringMatching(/Image with ID 9 was not found/), responseBody: { message: 'Not Found' } });
		await expect(run).rejects.not.toHaveProperty('body');
	});
});

describe('polling', () => {
	it('surfaces an error status at once with Placid error_message', async () => {
		vi.useFakeTimers();
		const spy = mockRoutes({
			routes: [
				() => ({ id: 1, status: 'queued' }),
				() => ({ id: 1, status: 'error', error_message: 'Invalid image URL', error_details: [{ layer: 'photo', message: 'not an image' }] }),
			],
		});
		const promise = createImage.run(context<typeof createImage.props>({ propsValue: { ...imageDefaults, template: 'tpl-1', create_now: true } }));
		const assertion = expect(promise).rejects.toThrow(/Invalid image URL \(photo: not an image\)/);
		await vi.advanceTimersByTimeAsync(6000);
		await assertion;
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it('does not retry a 401', async () => {
		vi.useFakeTimers();
		const spy = mockRoutes({
			routes: [() => ({ id: 1, status: 'queued' }), () => httpError({ status: 401, body: { message: 'Unauthenticated.' } })],
		});
		const promise = createPdf.run(context<typeof createPdf.props>({ propsValue: { ...imageDefaults, template: 'tpl-1', create_now: true } }));
		const assertion = expect(promise).rejects.toThrow(/token is invalid/);
		await vi.advanceTimersByTimeAsync(6000);
		await assertion;
		expect(spy).toHaveBeenCalledTimes(2);
	});

	it('retries 429 and 5xx, then returns the finished render', async () => {
		vi.useFakeTimers();
		const spy = mockRoutes({
			routes: [
				() => ({ id: 1, status: 'queued' }),
				() => httpError({ status: 429, body: {} }),
				() => httpError({ status: 502, body: {} }),
				() => ({ id: 1, status: 'finished', video_url: 'https://x/v.mp4' }),
			],
		});
		const promise = createVideo.run(context<typeof createVideo.props>({ propsValue: { ...videoDefaults, template: 'tpl-1', create_now: true } }));
		await vi.advanceTimersByTimeAsync(16000);
		expect(await promise).toMatchObject({ status: 'finished', video_url: 'https://x/v.mp4' });
		expect(spy).toHaveBeenCalledTimes(4);
	});

	it('returns the queued render when the wait cap is reached', async () => {
		vi.useFakeTimers();
		mockRoutes({ routes: [() => ({ id: 1, status: 'queued' })] });
		const promise = createImage.run(context<typeof createImage.props>({ propsValue: { ...imageDefaults, template: 'tpl-1', create_now: true } }));
		await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
		expect(await promise).toMatchObject({ id: 1, status: 'queued' });
	});
});

describe('ai discovery actions', () => {
	it('List Templates sends filters and pages until the limit', async () => {
		const spy = mockRoutes({
			routes: [
				() => ({ data: [template, { ...template, uuid: 'tpl-2' }], links: { next: `${BASE}/templates?page=2` } }),
				() => ({ data: [{ ...template, uuid: 'tpl-3' }], links: { next: `${BASE}/templates?page=3` } }),
			],
		});
		const result = await listTemplatesAi.run(
			context<typeof listTemplatesAi.props>({ propsValue: { ...listDefaults, title_filter: ' Card ', tag: 'ap-test', collection_id: '', order_by: 'title-asc', limit: 3 } }),
		);
		expect(requestAt({ spy, index: 0 })).toMatchObject({
			method: HttpMethod.GET,
			url: `${BASE}/templates`,
			queryParams: { title_filter: 'Card', tag: 'ap-test', order_by: 'title-asc' },
		});
		expect(requestAt({ spy, index: 1 }).url).toBe(`${BASE}/templates?page=2`);
		expect(requestAt({ spy, index: 1 }).queryParams).toBeUndefined();
		expect(result).toMatchObject({
			has_more: true,
			templates: [{ uuid: 'tpl-1', layers: template.layers }, { uuid: 'tpl-2' }, { uuid: 'tpl-3' }],
		});
	});

	it('Get Template is a GET on /templates/{uuid}', async () => {
		const spy = mockRoutes({ routes: [() => template] });
		const result = await getTemplateAi.run(context<typeof getTemplateAi.props>({ propsValue: { template_uuid: 'tpl-1' } }));
		expect(requestAt({ spy, index: 0 })).toMatchObject({ method: HttpMethod.GET, url: `${BASE}/templates/tpl-1` });
		expect(result).toMatchObject({ layers: template.layers });
	});

	it('List Collections maps template uuids', async () => {
		const spy = mockRoutes({ routes: [() => ({ data: [{ id: 4, title: 'Social', templates: [{ uuid: 'tpl-1' }, 'tpl-2'] }] })] });
		const result = await listCollectionsAi.run(context<typeof listCollectionsAi.props>({ propsValue: {} }));
		expect(requestAt({ spy, index: 0 })).toMatchObject({ method: HttpMethod.GET, url: `${BASE}/collections` });
		expect(result).toEqual({ collections: [{ id: 4, title: 'Social', template_uuids: ['tpl-1', 'tpl-2'] }] });
	});
});

describe('ai create actions', () => {
	it('Create Image (AI) validates layers then posts with create_now', async () => {
		const spy = mockRoutes({ routes: [() => template, () => ({ id: 1, status: 'finished', image_url: 'https://x/i.png' })] });
		const result = await createImageAi.run(
			context<typeof createImageAi.props>({
				propsValue: {
					...imageAiDefaults,
					template_uuid: ' tpl-1 ',
					layers: { title: { text: 'Hello' } },
					width: 1200,
					dpi: '300',
					image_format: 'jpg',
					wait_for_result: 'yes',
				},
			}),
		);
		expect(requestAt({ spy, index: 0 }).url).toBe(`${BASE}/templates/tpl-1`);
		const request = requestAt({ spy, index: 1 });
		expect(request.method).toBe(HttpMethod.POST);
		expect(request.url).toBe(`${BASE}/images`);
		expect(request.body).toEqual({
			template_uuid: 'tpl-1',
			layers: { title: { text: 'Hello' } },
			modifications: { width: 1200, image_format: 'jpg', dpi: 300 },
			create_now: true,
		});
		expect(result).toMatchObject({ image_url: 'https://x/i.png' });
	});

	it('Create Image (AI) rejects unknown layers with the valid list before rendering', async () => {
		const spy = mockRoutes({ routes: [() => template] });
		await expect(
			createImageAi.run(context<typeof createImageAi.props>({ propsValue: { ...imageAiDefaults, template_uuid: 'tpl-1', layers: { headline: { text: 'x' } } } })),
		).rejects.toThrow(/no layer named "headline".*title \(text\), photo \(picture\)/);
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('Create Image (AI) rejects layers that are not objects', async () => {
		mockRoutes({ routes: [() => template] });
		await expect(
			createImageAi.run(context<typeof createImageAi.props>({ propsValue: { ...imageAiDefaults, template_uuid: 'tpl-1', layers: { title: 'x' } } })),
		).rejects.toThrow(/layer "title" must be an object/);
	});

	it('Create PDF (AI) posts pages and modifications', async () => {
		const spy = mockRoutes({ routes: [() => template, () => ({ id: 2, status: 'queued' })] });
		await createPdfAi.run(
			context<typeof createPdfAi.props>({
				propsValue: {
					...pdfAiDefaults,
					pages: [{ template_uuid: 'tpl-1', layers: { title: { text: 'A' } } }, { template_uuid: 'tpl-1' }],
					image_quality: 'high',
					dpi: '150',
					color_mode: 'cmyk',
					filename: 'doc.pdf',
					wait_for_result: 'no',
				},
			}),
		);
		expect(spy).toHaveBeenCalledTimes(2);
		const request = requestAt({ spy, index: 1 });
		expect(request.url).toBe(`${BASE}/pdfs`);
		expect(request.body).toEqual({
			pages: [{ template_uuid: 'tpl-1', layers: { title: { text: 'A' } } }, { template_uuid: 'tpl-1' }],
			modifications: { filename: 'doc.pdf', image_quality: 'high', dpi: 150, color_mode: 'cmyk' },
			create_now: false,
		});
	});

	it('Create Video (AI) posts clips and rejects fps out of range', async () => {
		const spy = mockRoutes({ routes: [() => template, () => ({ id: 3, status: 'queued' })] });
		await createVideoAi.run(
			context<typeof createVideoAi.props>({
				propsValue: { ...videoAiDefaults, clips: [{ template_uuid: 'tpl-1', layers: { photo: { video: 'https://x/v.mp4' } } }], fps: 30, wait_for_result: 'no' },
			}),
		);
		expect(requestAt({ spy, index: 1 })).toMatchObject({
			method: HttpMethod.POST,
			url: `${BASE}/videos`,
			body: { clips: [{ template_uuid: 'tpl-1', layers: { photo: { video: 'https://x/v.mp4' } } }], modifications: { fps: 30 }, create_now: false },
		});
		await expect(
			createVideoAi.run(context<typeof createVideoAi.props>({ propsValue: { ...videoAiDefaults, clips: [{ template_uuid: 'tpl-1' }], fps: 60 } })),
		).rejects.toThrow(/fps/);
	});

	it('a render that comes back with status error fails with its message', async () => {
		mockRoutes({ routes: [() => template, () => ({ id: 8, status: 'error', error_message: 'Layer photo could not load' })] });
		await expect(
			createImageAi.run(context<typeof createImageAi.props>({ propsValue: { ...imageAiDefaults, template_uuid: 'tpl-1', wait_for_result: 'no' } })),
		).rejects.toThrow(/Layer photo could not load/);
	});
});

describe('live regressions', () => {
	it('Create PDF (AI) accepts pages as a JSON string and as an array of JSON strings', async () => {
		const pages = '[{"template_uuid": "tpl-1", "layers": {"title": {"text": "A"}}}]';
		const spy = mockRoutes({ routes: [() => template, () => ({ id: 2, status: 'queued' }), () => template, () => ({ id: 3, status: 'queued' })] });
		await createPdfAi.run(context<typeof createPdfAi.props>({ propsValue: { ...pdfAiDefaults, pages: JSON.parse(JSON.stringify([pages])), wait_for_result: 'no' } }));
		await createPdfAi.run(context<typeof createPdfAi.props>({ propsValue: { ...pdfAiDefaults, pages: [JSON.parse(pages)[0]], wait_for_result: 'no' } }));
		const expected = { pages: [{ template_uuid: 'tpl-1', layers: { title: { text: 'A' } } }], create_now: false };
		expect(requestAt({ spy, index: 1 }).body).toEqual(expected);
		expect(requestAt({ spy, index: 3 }).body).toEqual(expected);
	});

	it('Create Video (AI) accepts clips as a JSON string', async () => {
		const spy = mockRoutes({ routes: [() => template, () => ({ id: 3, status: 'queued' })] });
		const clips: unknown = '[{"template_uuid": "tpl-1"}]';
		await createVideoAi.run(context<typeof createVideoAi.props>({ propsValue: { ...videoAiDefaults, clips: Array.isArray(clips) ? clips : [clips], wait_for_result: 'no' } }));
		expect(requestAt({ spy, index: 1 }).body).toEqual({ clips: [{ template_uuid: 'tpl-1' }], create_now: false });
	});

	it('rejects invalid JSON with a clear message', async () => {
		mockRoutes({ routes: [() => template] });
		await expect(
			createPdfAi.run(context<typeof createPdfAi.props>({ propsValue: { ...pdfAiDefaults, pages: ['[{oops'] } })),
		).rejects.toThrow(/pages must be valid JSON/);
	});

	it('appends 422 field errors to the message', async () => {
		mockRoutes({
			routes: [
				() => template,
				() => httpError({ status: 422, body: { message: 'The given data was invalid.', errors: { image: ['The image could not be loaded.'] } } }),
			],
		});
		await expect(
			createImageAi.run(context<typeof createImageAi.props>({ propsValue: { ...imageAiDefaults, template_uuid: 'tpl-1', wait_for_result: 'no' } })),
		).rejects.toThrow(/The given data was invalid\. image: The image could not be loaded\./);
	});
});

describe('delete actions', () => {
	it('Delete actions send DELETE on their render paths', async () => {
		const spy = mockRoutes({ routes: [() => ''] });
		const results = [
			await deleteImageAi.run(context<typeof deleteImageAi.props>({ propsValue: { image_id: '1' } })),
			await deletePdfAi.run(context<typeof deletePdfAi.props>({ propsValue: { pdf_id: '2' } })),
			await deleteVideoAi.run(context<typeof deleteVideoAi.props>({ propsValue: { video_id: '3' } })),
		];
		expect([0, 1, 2].map((index) => requestAt({ spy, index }).url)).toEqual([`${BASE}/images/1`, `${BASE}/pdfs/2`, `${BASE}/videos/3`]);
		expect(requestAt({ spy, index: 0 }).method).toBe(HttpMethod.DELETE);
		expect(results).toEqual([
			{ deleted: true, id: '1' },
			{ deleted: true, id: '2' },
			{ deleted: true, id: '3' },
		]);
	});

	it('treats a repeat delete 404 as already deleted', async () => {
		mockRoutes({ routes: [() => httpError({ status: 404, body: {} })] });
		await expect(deleteImageAi.run(context<typeof deleteImageAi.props>({ propsValue: { image_id: '1' } }))).resolves.toEqual({ deleted: true, id: '1' });
	});
});

describe('convert file to url', () => {
	it('uploads native multipart with the real MIME type', async () => {
		const spy = mockRoutes({ routes: [() => ({ media: [{ file_key: 'file', file_id: 'https://cdn/x.png' }] })] });
		const result = await convertFileToUrl.run(
			context<typeof convertFileToUrl.props>({
				propsValue: { filename: undefined, file: { filename: 'a.png', extension: 'png', base64: Buffer.from('png').toString('base64'), data: Buffer.from('png') } },
			}),
		);
		const request = requestAt({ spy, index: 0 });
		expect(request.method).toBe(HttpMethod.POST);
		expect(request.url).toBe(`${BASE}/media`);
		expect(request.body).toBeInstanceOf(FormData);
		const form = request.body instanceof FormData ? request.body : new FormData();
		const part = form.get('file');
		expect(part).toBeInstanceOf(Blob);
		expect(part instanceof Blob ? part.type : '').toBe('image/png');
		expect(result).toEqual({ media: [{ file_key: 'file', file_id: 'https://cdn/x.png' }], url: 'https://cdn/x.png' });
	});
});
