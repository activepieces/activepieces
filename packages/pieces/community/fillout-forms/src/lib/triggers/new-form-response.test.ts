/// <reference types="vitest/globals" />

import { newFormResponse } from './new-form-response';

const SUBMISSION = {
  submissionId: 'abc123',
  submissionTime: '2026-08-31T10:00:00.000Z',
  questions: [
    {
      id: '5AtgG35AAZVcrSVfRubvp1',
      name: 'What is your name?',
      type: 'ShortAnswer',
      value: 'John Doe',
    },
  ],
  calculations: [],
  urlParameters: [],
};

const WEBHOOK_BODY = {
  formId: 'vs1PXaHmRfus',
  formName: 'Contact form',
  submission: SUBMISSION,
};

const buildContext = (body: unknown) =>
  ({
    payload: {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      queryParams: {},
    },
  } as never);

describe('fillout new-form-response run()', () => {
  test('returns the submission when the body is an already-parsed object', async () => {
    const output = await newFormResponse.run(buildContext(WEBHOOK_BODY));

    expect(output).toEqual([SUBMISSION]);
  });

  test('still returns the submission when the body is a raw JSON string', async () => {
    const output = await newFormResponse.run(
      buildContext(JSON.stringify(WEBHOOK_BODY))
    );

    expect(output).toEqual([SUBMISSION]);
  });

  test('returns an array holding exactly one item', async () => {
    const output = await newFormResponse.run(buildContext(WEBHOOK_BODY));

    expect(Array.isArray(output)).toBe(true);
    expect(output).toHaveLength(1);
  });

  test('a parsed body without a submission yields one undefined item', async () => {
    const output = await newFormResponse.run(buildContext({}));

    expect(output).toEqual([undefined]);
  });

  test('a string body that is not JSON still raises', async () => {
    await expect(
      newFormResponse.run(buildContext('not json'))
    ).rejects.toThrow(SyntaxError);
  });
});
