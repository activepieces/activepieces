import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { solveCaptchaAction } from "../src/lib/actions/solve-captcha";

const mock = new MockAdapter(axios);

describe("CAPTCHA Solver Action", () => {
  beforeEach(() => {
    mock.reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("2Captcha: Successfully solves reCAPTCHA v2", async () => {
    // Mock submission
    mock.onPost("https://2captcha.com/in.php").reply(200, {
      status: 1,
      request: "TEST_TASK_ID",
    });

    // Mock polling - first not ready, then success
    mock.onGet("https://2captcha.com/res.php").replyOnce(200, {
      status: 0,
      request: "CAPCHA_NOT_READY",
    }).onGet("https://2captcha.com/res.php").replyOnce(200, {
      status: 1,
      request: "TOKEN_12345",
    });

    const runPromise = solveCaptchaAction.run({
      propsValue: {
        service: "2captcha",
        captchaType: "recaptcha_v2",
        siteKey: "site_key",
        pageUrl: "https://example.com",
        maxRetries: 5,
      },
      auth: "fake_key",
      store: {} as any,
    } as any);

    // Advance timers to trigger polling
    await jest.advanceTimersByTimeAsync(5000); // First poll (not ready)
    await jest.advanceTimersByTimeAsync(5000); // Second poll (success)

    const result = await runPromise;

    expect(result.status).toBe("success");
    expect(result.solution).toBe("TOKEN_12345");
  });

  test("Anti-Captcha: Successfully solves hCaptcha", async () => {
    // Mock submission
    mock.onPost("https://api.anti-captcha.com/createTask").reply(200, {
      errorId: 0,
      taskId: 98765,
    });

    // Mock polling
    mock.onPost("https://api.anti-captcha.com/getTaskResult").reply(200, {
      errorId: 0,
      status: "ready",
      solution: {
        gRecaptchaResponse: "HCAPTCHA_TOKEN",
      },
    });

    const runPromise = solveCaptchaAction.run({
      propsValue: {
        service: "anti-captcha",
        captchaType: "hcaptcha",
        siteKey: "site_key_h",
        pageUrl: "https://example.com/h",
      },
      auth: "fake_key",
      store: {} as any,
    } as any);

    await jest.advanceTimersByTimeAsync(5000);

    const result = await runPromise;

    expect(result.status).toBe("success");
    expect(result.solution).toBe("HCAPTCHA_TOKEN");
  });

  test("Handles timeout", async () => {
    mock.onPost("https://2captcha.com/in.php").reply(200, {
      status: 1,
      request: "STUCK_TASK",
    });

    mock.onGet("https://2captcha.com/res.php").reply(200, {
      status: 0,
      request: "CAPCHA_NOT_READY",
    });

    const runPromise = solveCaptchaAction.run({
      propsValue: {
        service: "2captcha",
        captchaType: "recaptcha_v2",
        siteKey: "site_key",
        pageUrl: "https://example.com",
        maxRetries: 2,
      },
      auth: "fake_key",
      store: {} as any,
    } as any);

    await jest.advanceTimersByTimeAsync(5000);
    await jest.advanceTimersByTimeAsync(5000);

    const result = await runPromise;

    expect(result.status).toBe("failure");
    expect(result.errorMessage).toBe("Timed out waiting for solution");
  });
});
