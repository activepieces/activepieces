import { ActionContext, createAction, Property } from "@activepieces/pieces-framework";
import axios from "axios";
import { captchaSolverAuth } from "../auth";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const solveCaptchaAction = createAction({
  name: "solve_captcha",
  displayName: "Solve CAPTCHA",
  description: "Automatically solve CAPTCHAs using 2Captcha, Anti-Captcha, or CapSolver.",
  auth: captchaSolverAuth,
  props: {
    service: Property.StaticDropdown({
      displayName: "Service",
      description: "Select the CAPTCHA solving service.",
      required: true,
      options: {
        options: [
          { label: "2Captcha", value: "2captcha" },
          { label: "Anti-Captcha", value: "anti-captcha" },
          { label: "CapSolver", value: "capsolver" },
        ],
      },
    }),
    captchaType: Property.StaticDropdown({
      displayName: "CAPTCHA Type",
      description: "Type of CAPTCHA to solve.",
      required: true,
      options: {
        options: [
          { label: "reCAPTCHA v2", value: "recaptcha_v2" },
          { label: "reCAPTCHA v3", value: "recaptcha_v3" },
          { label: "hCaptcha", value: "hcaptcha" },
        ],
      },
    }),
    siteKey: Property.ShortText({
      displayName: "Site Key",
      description: "The CAPTCHA site key from the target page.",
      required: true,
    }),
    pageUrl: Property.ShortText({
      displayName: "Page URL",
      description: "The URL of the page where the CAPTCHA is located.",
      required: true,
    }),
    maxRetries: Property.Number({
      displayName: "Max Retries",
      description: "Maximum number of polling attempts (default: 20).",
      required: false,
      defaultValue: 20,
    }),
    callbackUrl: Property.ShortText({
      displayName: "Callback URL",
      description: "Optional: The Activepieces webhook URL to receive the solution (Pingback).",
      required: false,
    }),
  },
  async run(context: ActionContext<typeof captchaSolverAuth>) {
    const { service, captchaType, siteKey, pageUrl, maxRetries = 20, callbackUrl } = context.propsValue;
    const apiKey = context.auth;

    try {
      let taskId = "";
      
      // Step 1: Submit CAPTCHA
      if (service === "2captcha") {
        const params: any = {
          key: apiKey,
          method: captchaType === "hcaptcha" ? "hcaptcha" : "userrecaptcha",
          pageurl: pageUrl,
          json: 1,
          pingback: callbackUrl,
        };

        if (captchaType === "hcaptcha") {
          params.sitekey = siteKey;
        } else {
          params.googlekey = siteKey;
        }

        if (captchaType === "recaptcha_v3") {
          params.version = "v3";
        }

        const response = await axios.post("https://2captcha.com/in.php", null, { params });
        if (response.data.status !== 1) throw new Error(response.data.request || "Failed to submit to 2Captcha");
        taskId = response.data.request;
      } else if (service === "anti-captcha" || service === "capsolver") {
        const url = service === "anti-captcha" ? "https://api.anti-captcha.com/createTask" : "https://api.capsolver.com/createTask";
        
        let type = "";
        if (captchaType === "recaptcha_v2") type = "NoCaptchaTaskProxyless";
        else if (captchaType === "recaptcha_v3") type = "RecaptchaV3TaskProxyless";
        else if (captchaType === "hcaptcha") type = "HCaptchaTaskProxyless";

        const response = await axios.post(url, {
          clientKey: apiKey,
          task: {
            type,
            websiteURL: pageUrl,
            websiteKey: siteKey,
          },
          callbackUrl,
        });
        if (response.data.errorId !== 0) throw new Error(response.data.errorDescription || `Failed to submit to ${service}`);
        taskId = response.data.taskId;
      }

      // Step 2: Poll for solution
      let attempts = 0;
      while (attempts < maxRetries) {
        attempts++;
        await delay(5000); // Wait 5 seconds between polls

        if (service === "2captcha") {
          const res = await axios.get("https://2captcha.com/res.php", {
            params: { key: apiKey, action: "get", id: taskId, json: 1 },
          });
          if (res.data.status === 1) {
            return { solution: res.data.request, status: "success" };
          }
          if (res.data.request !== "CAPCHA_NOT_READY") throw new Error(res.data.request);
        } else {
          const url = service === "anti-captcha" ? "https://api.anti-captcha.com/getTaskResult" : "https://api.capsolver.com/getTaskResult";
          const res = await axios.post(url, { clientKey: apiKey, taskId });
          if (res.data.status === "ready") {
            return { 
              solution: res.data.solution.gRecaptchaResponse || res.data.solution.token || res.data.solution.text, 
              status: "success" 
            };
          }
          if (res.data.errorId !== 0) throw new Error(res.data.errorDescription);
        }
      }

      return { status: "failure", errorMessage: "Timed out waiting for solution" };
    } catch (error: any) {
      return { status: "failure", errorMessage: error.message || "Unknown error occurred" };
    }
  },
});
