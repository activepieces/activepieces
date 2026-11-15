import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  Action,
  AppConnectionType,
  createMockActionContext,
  InputPropertyMap,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { googleSlidesAuth, GoogleSlidesAuthValue } from '../src/lib/auth';
import { Presentation } from '../src/lib/commons/common';
import { addSlide } from '../src/lib/actions/add-slide';
import { createShape } from '../src/lib/actions/create-shape';
import { createTable } from '../src/lib/actions/create-table';
import { deleteSlide } from '../src/lib/actions/delete-slide';
import { duplicateSlide } from '../src/lib/actions/duplicate-slide';
import { insertImage } from '../src/lib/actions/insert-image';
import { insertVideo } from '../src/lib/actions/insert-video';
import { moveSlide } from '../src/lib/actions/move-slide';
import { refreshSheetsCharts } from '../src/lib/actions/refresh-charts';
import { setSpeakerNotes } from '../src/lib/actions/set-speaker-notes';

const PID = '1AbCdEfGhIjKlMnOpQrStUvWxYz';
const REVISION = 'rev-read-1';
const PINNED = { requiredRevisionId: REVISION };

const AUTH: GoogleSlidesAuthValue = {
  type: AppConnectionType.OAUTH2,
  access_token: 'test-token',
  client_id: 'client',
  client_secret: 'secret',
  redirect_url: 'https://example.com',
  token_type: 'Bearer',
  claimed_at: 0,
  refresh_token: 'refresh',
  scope: '',
  token_url: 'https://oauth2.googleapis.com/token',
  data: {},
};

const STALE = new HttpError(
  {},
  {
    status: 400,
    responseBody: {
      error: { code: 400, message: `The required revision ID '${REVISION}' does not match the latest revision.`, status: 'INVALID_ARGUMENT' },
    },
  }
);

function deck(): Presentation {
  return {
    presentationId: PID,
    revisionId: REVISION,
    layouts: [{ objectId: 'layout_blank', layoutProperties: { name: 'BLANK' }, pageElements: [] }],
    slides: [
      {
        objectId: 's1',
        pageElements: [{ objectId: 'chart1', sheetsChart: { spreadsheetId: 'sheet', chartId: 1 } }],
        slideProperties: {
          notesPage: {
            notesProperties: { speakerNotesObjectId: 'notes1' },
            pageElements: [{ objectId: 'notes1', shape: { text: { textElements: [{ textRun: { content: 'Old\n' } }] } } }],
          },
        },
      },
      { objectId: 's2', pageElements: [] },
    ],
  };
}

let posts: unknown[] = [];
let getCount = 0;
let failBatchWith: HttpError | undefined;

beforeEach(() => {
  posts = [];
  getCount = 0;
  failBatchWith = undefined;
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    if (request.method === HttpMethod.POST) {
      if (failBatchWith) {
        throw failBatchWith;
      }
      posts.push(request.body);
      return { status: 200, headers: {}, body: { presentationId: PID, replies: [] } };
    }
    getCount += 1;
    return { status: 200, headers: {}, body: deck() };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function run<Props extends InputPropertyMap>({
  action,
  propsValue,
}: {
  action: Action<typeof googleSlidesAuth, Props>;
  propsValue: StaticPropsValue<Props>;
}): Promise<unknown> {
  return action.run({ ...createMockActionContext<Props>({ propsValue }), auth: AUTH });
}

const box = { x: 10, y: 10, width: 100, height: 50 };

const writesAfterRead: { name: string; call: () => Promise<unknown> }[] = [
  {
    name: 'create_shape',
    call: () =>
      run({
        action: createShape,
        propsValue: { presentation_id: PID, slide_number: 2, slide_object_id: undefined, shape_type: undefined, ...box, text: undefined, fill_color: undefined },
      }),
  },
  {
    name: 'create_table',
    call: () =>
      run({
        action: createTable,
        propsValue: {
          presentation_id: PID,
          slide_number: 2,
          slide_object_id: undefined,
          data: undefined,
          rows: 2,
          columns: 2,
          header_bold: undefined,
          header_fill_color: undefined,
          x: undefined,
          y: undefined,
          width: undefined,
          height: undefined,
        },
      }),
  },
  {
    name: 'insert_image',
    call: () =>
      run({
        action: insertImage,
        propsValue: { presentation_id: PID, slide_number: 2, slide_object_id: undefined, image_url: 'https://example.com/a.png', x: undefined, y: undefined, width: undefined, height: undefined },
      }),
  },
  {
    name: 'insert_video',
    call: () =>
      run({
        action: insertVideo,
        propsValue: { presentation_id: PID, slide_number: 2, slide_object_id: undefined, video: 'M7lc1UVf-VE', source: undefined, x: undefined, y: undefined, width: undefined, height: undefined },
      }),
  },
  {
    name: 'add_slide',
    call: () => run({ action: addSlide, propsValue: { presentation_id: PID, layout: 'BLANK', position: 1, title: undefined, body: undefined } }),
  },
  {
    name: 'duplicate_slide',
    call: () => run({ action: duplicateSlide, propsValue: { presentation_id: PID, slide_number: 1, slide_object_id: undefined, position: undefined } }),
  },
  {
    name: 'move_slide',
    call: () => run({ action: moveSlide, propsValue: { presentation_id: PID, slide_number: 1, slide_object_id: undefined, position: 2 } }),
  },
  {
    name: 'delete_slide',
    call: () => run({ action: deleteSlide, propsValue: { presentation_id: PID, slide_number: 2, slide_object_id: undefined } }),
  },
  {
    name: 'set_speaker_notes',
    call: () => run({ action: setSpeakerNotes, propsValue: { presentation_id: PID, slide_number: 1, slide_object_id: undefined, notes: 'New', clear_notes: undefined } }),
  },
  {
    name: 'refresh_sheets_charts',
    call: () => run({ action: refreshSheetsCharts, propsValue: { presentation_id: PID } }),
  },
];

describe('writes that follow a read pin the revision they read', () => {
  it.each(writesAfterRead)('$name sends writeControl.requiredRevisionId', async ({ call }) => {
    await call();
    expect(getCount).toBe(1);
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ writeControl: PINNED });
  });

  it.each(writesAfterRead)('$name explains a revision mismatch', async ({ call }) => {
    failBatchWith = STALE;
    await expect(call()).rejects.toThrow(/the presentation changed since it was read, so nothing was changed\. Run the step again/);
  });

  it('skips the read and the pin when the slide is chosen by object ID', async () => {
    await run({
      action: insertImage,
      propsValue: { presentation_id: PID, slide_number: undefined, slide_object_id: 's2', image_url: 'https://example.com/a.png', x: undefined, y: undefined, width: undefined, height: undefined },
    });
    expect(getCount).toBe(0);
    expect(posts).toHaveLength(1);
    expect(posts[0]).not.toHaveProperty('writeControl');
  });

  it('places content on the slide that was read by number', async () => {
    await run({
      action: insertImage,
      propsValue: { presentation_id: PID, slide_number: 2, slide_object_id: undefined, image_url: 'https://example.com/a.png', x: undefined, y: undefined, width: undefined, height: undefined },
    });
    expect(posts[0]).toMatchObject({
      requests: [{ createImage: { elementProperties: { pageObjectId: 's2' } } }],
      writeControl: PINNED,
    });
  });
});
