import { Property, createAction } from '@activepieces/pieces-framework';
import {
  createRunner,
  parse,
  PuppeteerRunnerExtension,
} from '@puppeteer/replay';
import puppeteer from 'puppeteer';

export const replayAction = createAction({
  name: 'replay',
  displayName: 'Replay',
  description: 'Replay a recording',
  props: {
    recording: Property.Json({
      displayName: 'Recording',
      required: true,
    }),
  },
  run: async ({ propsValue }) => {
    const { recording } = propsValue;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const runner = await createRunner(
      parse(recording),
      new PuppeteerRunnerExtension(browser, page)
    );
    try {
      const result = await runner.run();
      await browser.close();
      return result;
    } catch (e) {
      await browser.close();
      return (e as Error).message;
    }
  },
});
