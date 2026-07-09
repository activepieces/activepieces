// TestMu AI (formerly LambdaTest) Browser Cloud runs on a W3C WebDriver hub.
// A session is bound to the hub (region) that created it, so every action must
// target the same region — which is why region is configured on the connection
// (auth), not per action.
export const HUB_URL_BY_REGION: Record<string, string> = {
  us: 'https://hub.lambdatest.com/wd/hub',
  eu: 'https://eu-hub.lambdatest.com/wd/hub',
};

// Default W3C capabilities used when creating a session. The Create Session
// action can override any of these.
export const DEFAULT_CAPABILITIES: Record<string, unknown> = {
  browserName: 'Chrome',
  browserVersion: 'latest',
  platformName: 'Windows 11',
};

// The W3C WebDriver spec identifies a located element by this exact key in the
// response body of POST /session/{id}/element. It is a fixed magic string.
export const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';
