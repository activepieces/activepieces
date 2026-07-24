import { createAction, Property } from '@activepieces/pieces-framework';
import { testmuaiAuth } from '../common/auth';
import { testmuaiCommon, TestMuAuth } from '../common/client';

export const createSession = createAction({
  auth: testmuaiAuth,
  name: 'create_session',
  displayName: 'Create Session',
  description:
    'Start a new cloud browser session and return a Session ID used by every other action.',
  audience: 'both',
  aiMetadata: {
    description:
      'Starts a fresh cloud browser and returns a sessionId. Call this FIRST, before any other browser action, and pass the returned sessionId to every subsequent action. Always call Release Session when finished to free the browser. Not idempotent: each call launches a new, separate browser.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Session Name',
      description: 'A label to identify this session in the TestMu AI dashboard.',
      required: false,
    }),
    browserName: Property.StaticDropdown({
      displayName: 'Browser',
      description: 'The browser to launch.',
      required: false,
      defaultValue: 'Chrome',
      options: {
        options: [
          { label: 'Chrome', value: 'Chrome' },
          { label: 'Microsoft Edge', value: 'MicrosoftEdge' },
          { label: 'Firefox', value: 'Firefox' },
        ],
      },
    }),
    browserVersion: Property.ShortText({
      displayName: 'Browser Version',
      description: 'e.g. "latest", "latest-1", or a specific version number.',
      required: false,
      defaultValue: 'latest',
    }),
    platformName: Property.StaticDropdown({
      displayName: 'Platform',
      description: 'The operating system to run the browser on.',
      required: false,
      defaultValue: 'Windows 11',
      options: {
        options: [
          { label: 'Windows 11', value: 'Windows 11' },
          { label: 'Windows 10', value: 'Windows 10' },
          { label: 'macOS Sonoma', value: 'macOS Sonoma' },
          { label: 'macOS Ventura', value: 'macOS Ventura' },
        ],
      },
    }),
  },
  async run(context) {
    const auth: TestMuAuth = context.auth.props;
    const { name, browserName, browserVersion, platformName } =
      context.propsValue;

    const sessionId = await testmuaiCommon.createSession({
      auth,
      name,
      capabilities: {
        browserName: browserName ?? 'Chrome',
        browserVersion: browserVersion ?? 'latest',
        platformName: platformName ?? 'Windows 11',
      },
    });

    return {
      sessionId,
      dashboardUrl: `https://automation.lambdatest.com/test?testID=${sessionId}`,
      browserName: browserName ?? 'Chrome',
      browserVersion: browserVersion ?? 'latest',
      platformName: platformName ?? 'Windows 11',
    };
  },
});
