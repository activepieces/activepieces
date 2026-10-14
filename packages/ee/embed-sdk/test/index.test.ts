import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ActivepiecesClientEventName,
  ActivepiecesEmbedded,
  ActivepiecesVendorEventName,
} from '../src/index';

describe('ActivepiecesEmbedded', () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="${CONTAINER_ID}"></div>`;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('defers navigate() calls made before the handshake and applies the latest one once configuration finishes', async () => {
    const sdk = new ActivepiecesEmbedded();
    const configurePromise = configureSdk({ sdk });
    const { iframeWindow, postMessageSpy } = spyOnDashboardIframe();

    sdk.navigate({ route: '/pre-handshake-1' });
    sdk.navigate({ route: '/pre-handshake-2' });
    expect(getPostedMessages(postMessageSpy)).toEqual([]);

    completeHandshake({ iframeWindow });
    await configurePromise;

    const routeMessages = getPostedMessages(postMessageSpy).filter(
      (message) =>
        message.type === ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED,
    );
    expect(routeMessages).toEqual([
      {
        type: ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED,
        data: { vendorRoute: '/pre-handshake-2' },
      },
    ]);
  });

  it('posts navigate() immediately after the handshake has finished', async () => {
    const sdk = new ActivepiecesEmbedded();
    const configurePromise = configureSdk({ sdk });
    const { iframeWindow, postMessageSpy } = spyOnDashboardIframe();
    completeHandshake({ iframeWindow });
    await configurePromise;
    postMessageSpy.mockClear();

    sdk.navigate({ route: 'flows' });

    expect(getPostedMessages(postMessageSpy)).toEqual([
      {
        type: ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED,
        data: { vendorRoute: '/flows' },
      },
    ]);
  });

  it('removes the old iframe and its listeners when configure() is called again', async () => {
    const sdk = new ActivepiecesEmbedded();
    const navigationHandler = vi.fn();
    const firstConfigurePromise = configureSdk({ sdk, navigationHandler });
    const { iframeWindow: oldIframeWindow } = spyOnDashboardIframe();
    completeHandshake({ iframeWindow: oldIframeWindow });
    await firstConfigurePromise;

    const secondConfigurePromise = configureSdk({ sdk, navigationHandler });
    const { iframeWindow: newIframeWindow } = spyOnDashboardIframe();
    completeHandshake({ iframeWindow: newIframeWindow });
    await secondConfigurePromise;

    expect(
      document.querySelectorAll(`#${CONTAINER_ID} iframe`),
    ).toHaveLength(1);

    dispatchFromIframe({
      source: oldIframeWindow,
      data: {
        type: ActivepiecesClientEventName.CLIENT_ROUTE_CHANGED,
        data: { route: '/from-old-iframe' },
      },
    });
    expect(navigationHandler).not.toHaveBeenCalled();

    dispatchFromIframe({
      source: newIframeWindow,
      data: {
        type: ActivepiecesClientEventName.CLIENT_ROUTE_CHANGED,
        data: { route: '/from-new-iframe' },
      },
    });
    expect(navigationHandler).toHaveBeenCalledTimes(1);
    expect(navigationHandler).toHaveBeenCalledWith({
      route: '/from-new-iframe',
    });
  });

  it('sends the configured initialRoute in VENDOR_INIT, prepending a forward slash when missing', () => {
    const sdk = new ActivepiecesEmbedded();
    configureSdk({ sdk, initialRoute: 'runs' });
    const { iframeWindow, postMessageSpy } = spyOnDashboardIframe();

    dispatchFromIframe({
      source: iframeWindow,
      data: { type: ActivepiecesClientEventName.CLIENT_INIT, data: {} },
    });

    const initMessages = getPostedMessages(postMessageSpy).filter(
      (message) => message.type === ActivepiecesVendorEventName.VENDOR_INIT,
    );
    expect(initMessages).toHaveLength(1);
    expect(initMessages[0].data.initialRoute).toBe('/runs');
  });

  it('sends the configured analytics ids in VENDOR_INIT', () => {
    const sdk = new ActivepiecesEmbedded();
    configureSdk({
      sdk,
      analytics: { gtmContainerId: 'GTM-ABC123', clarityProjectId: 'abc123xyz' },
    });
    const { iframeWindow, postMessageSpy } = spyOnDashboardIframe();

    dispatchFromIframe({
      source: iframeWindow,
      data: { type: ActivepiecesClientEventName.CLIENT_INIT, data: {} },
    });

    const initMessages = getPostedMessages(postMessageSpy).filter(
      (message) => message.type === ActivepiecesVendorEventName.VENDOR_INIT,
    );
    expect(initMessages).toHaveLength(1);
    expect(initMessages[0].data.gtmContainerId).toBe('GTM-ABC123');
    expect(initMessages[0].data.clarityProjectId).toBe('abc123xyz');
  });

  it('cancels a configure() that is superseded while still waiting for its container', async () => {
    document.body.innerHTML = '';
    const sdk = new ActivepiecesEmbedded();
    const firstConfigure = configureSdk({ sdk });
    const secondConfigure = configureSdk({ sdk });

    await expect(firstConfigure).resolves.toEqual({ status: 'superseded' });

    document.body.innerHTML = `<div id="${CONTAINER_ID}"></div>`;
    await waitFor(
      () => document.querySelectorAll(`#${CONTAINER_ID} iframe`).length > 0,
    );
    expect(document.querySelectorAll(`#${CONTAINER_ID} iframe`)).toHaveLength(1);

    const { iframeWindow } = spyOnDashboardIframe();
    completeHandshake({ iframeWindow });
    await expect(secondConfigure).resolves.toEqual({ status: 'success' });
  });

  it('rejects configure() when embedding throws while the container is already present', async () => {
    const embedError = new Error('iframe creation failed');
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      throw embedError;
    });

    await expect(
      configureSdk({ sdk: new ActivepiecesEmbedded() }),
    ).rejects.toBe(embedError);
  });

  describe('when the container is missing at configure()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      document.body.innerHTML = '';
    });

    it('rejects configure() with the container error when the container never appears', async () => {
      const outcome = settled(configureSdk({ sdk: new ActivepiecesEmbedded() }));
      await vi.runAllTimersAsync();

      expect(await settledOrPending(outcome)).toEqual({
        rejected: 'container not found',
      });
    });

    it('keeps a superseded configure() resolved as superseded when the container never appears', async () => {
      const sdk = new ActivepiecesEmbedded();
      const firstConfigure = settled(configureSdk({ sdk }));
      const secondConfigure = settled(configureSdk({ sdk }));
      await vi.runAllTimersAsync();

      expect(await settledOrPending(firstConfigure)).toEqual({
        resolved: { status: 'superseded' },
      });
      expect(await settledOrPending(secondConfigure)).toEqual({
        rejected: 'container not found',
      });
    });

    it('rejects configure() when embedding throws after the container appears late', async () => {
      const outcome = settled(configureSdk({ sdk: new ActivepiecesEmbedded() }));
      const embedError = new Error('iframe creation failed');
      vi.spyOn(document, 'createElement').mockImplementation(() => {
        throw embedError;
      });
      document.body.innerHTML = `<div id="${CONTAINER_ID}"></div>`;
      await vi.runAllTimersAsync();

      expect(await settledOrPending(outcome)).toEqual({ rejected: embedError });
    });
  });

  it('resets the cached embedding auth when configure() is called again', () => {
    const sdk = new ActivepiecesEmbedded();
    sdk._embeddingAuth = {
      userJwtToken: 'stale-token',
      platformId: 'platform',
      projectId: 'project',
    };

    configureSdk({ sdk });

    expect(sdk._embeddingAuth).toBeUndefined();
  });

  it('logs an error instead of deferring navigate() when no container is configured', () => {
    const sdk = new ActivepiecesEmbedded();
    sdk.configure({ instanceUrl: INSTANCE_URL, jwtToken: 'test-jwt' });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    sdk.navigate({ route: '/flows' });

    expect(errorSpy).toHaveBeenCalledWith(
      'Activepieces: dashboard iframe not found',
    );
  });
});

function configureSdk({
  sdk,
  initialRoute,
  navigationHandler,
  analytics,
}: {
  sdk: ActivepiecesEmbedded;
  initialRoute?: string;
  navigationHandler?: (data: { route: string }) => void;
  analytics?: { gtmContainerId?: string; clarityProjectId?: string };
}) {
  return sdk.configure({
    instanceUrl: INSTANCE_URL,
    jwtToken: 'test-jwt',
    embedding: {
      containerId: CONTAINER_ID,
      initialRoute,
      analytics,
      navigation: navigationHandler
        ? { handler: navigationHandler }
        : undefined,
    },
  });
}

function spyOnDashboardIframe() {
  const iframes = document.querySelectorAll(`#${CONTAINER_ID} iframe`);
  const iframe = iframes[iframes.length - 1];
  if (!(iframe instanceof HTMLIFrameElement) || !iframe.contentWindow) {
    throw new Error('dashboard iframe or its window not found');
  }
  const iframeWindow = iframe.contentWindow;
  const postMessageSpy = vi.spyOn(iframeWindow, 'postMessage');
  return { iframeWindow, postMessageSpy };
}

function dispatchFromIframe({
  source,
  data,
}: {
  source: Window;
  data: PostedMessage;
}) {
  window.dispatchEvent(
    new MessageEvent('message', {
      data,
      source,
      origin: new URL(INSTANCE_URL).origin,
    }),
  );
}

async function waitFor(condition: () => boolean) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('condition not met in time');
}

function settled(promise: Promise<unknown>) {
  return promise.then(
    (value: unknown) => ({ resolved: value }),
    (error: unknown) => ({ rejected: error }),
  );
}

function settledOrPending(promise: Promise<unknown>) {
  return Promise.race([promise, Promise.resolve('still pending')]);
}

function completeHandshake({ iframeWindow }: { iframeWindow: Window }) {
  dispatchFromIframe({
    source: iframeWindow,
    data: { type: ActivepiecesClientEventName.CLIENT_INIT, data: {} },
  });
  dispatchFromIframe({
    source: iframeWindow,
    data: {
      type: ActivepiecesClientEventName.CLIENT_CONFIGURATION_FINISHED,
      data: {},
    },
  });
}

function getPostedMessages(
  postMessageSpy: ReturnType<typeof spyOnDashboardIframe>['postMessageSpy'],
): PostedMessage[] {
  return postMessageSpy.mock.calls.map(([message]) => message);
}

const INSTANCE_URL = 'http://instance.test';
const CONTAINER_ID = 'ap-container';

type PostedMessage = {
  type: string;
  data: Record<string, unknown>;
};
