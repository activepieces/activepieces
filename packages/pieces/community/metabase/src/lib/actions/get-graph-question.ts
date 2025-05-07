import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAuth } from '../..';
import jwt from 'jsonwebtoken';
import { chromium } from 'playwright';

export const getGraphQuestion = createAction({
  name: 'getGraphQuestion',
  auth: metabaseAuth,
  requireAuth: true,
  displayName: 'Get the graph of the question',
  description: 'Get the graph of a Metabase question and save it as a png',
  props: {
    questionId: Property.ShortText({
      displayName: 'Metabase question ID',
      required: true,
    }),
    parameters: Property.Object({
      displayName: 'Parameters (slug name -> value)',
      required: false,
    }),
    graphName: Property.ShortText({
      displayName: 'The name of the graph (without the extension)',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    if ('embeddingKey' in auth && !auth.embeddingKey)
      return 'An embedding key is needed.';

    const questionId = propsValue.questionId.split('-')[0];
    const numericQuestionId = parseInt(questionId);

    const payload = {
      resource: { question: numericQuestionId },
      params: propsValue.parameters,
      exp: Math.round(Date.now() / 1000) + 10 * 60,
    };

    // @ts-expect-error we expect an embedding key if the user can use this action.
    const token = jwt.sign(payload, auth.embeddingKey);
    const graphName = propsValue.graphName
      ? propsValue.graphName + '.png'
      : `metabase_question_${questionId}.png`;

    const iframeUrl =
      auth.baseUrl + '/embed/question/' + token + '#bordered=true&titled=true';

    const browser = await chromium.launch({
      headless: true,
      chromiumSandbox: false,
      executablePath: '/usr/bin/chromium',
    });

    try {
      const context = await browser.newContext({
        viewport: {
          width: 1600,
          height: 1200,
        },
        deviceScaleFactor: 2,
      });

      const page = await context.newPage();

      const response = await page.goto(iframeUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      if (!response || !response.ok()) {
        throw new Error(
          `Page load failed with status: ${response ? response.status() : 400}`
        );
      }

      const screenshotBuffer = await page.screenshot({
        path: graphName,
        type: 'png',
        clip: {
          x: 0,
          y: 0,
          width: 1600,
          height: 1120, // so it screenshots only the graph
        },
      });

      const fileUrl = await files.write({
        fileName: graphName,
        data: screenshotBuffer,
      });

      return {
        file: {
          filename: graphName,
          base64Content: screenshotBuffer.toString('base64'),
          download: fileUrl,
        },
        iframeUrl,
      };
    } catch (error) {
      console.error(
        'Please verify that either your embedding key and question id are valid or that the question is embedded and published.'
      );
      console.error('Error capturing Metabase chart:', error);
      throw error;
    } finally {
      await browser.close();
    }
  },
});
