# CAPTCHA Solver Piece

Enable workflows to automatically solve CAPTCHAs during automation tasks using popular solving services in Activepieces.

## Features

- **Multi-Service Integration**: Built-in support for 2Captcha, Anti-Captcha, and CapSolver.
- **Asynchronous Polling**: Automatically waits for results from solving services.
- **Support for reCAPTCHA v2/v3**: Solve multiple versions of reCAPTCHA and hCaptcha.
- **Dynamic Inputs**: Accepts site key, page URL, and provider-specific parameters.
- **Configurable retries and- **timeout**: Maximum time to wait for a solution (default: 120s).
- **callbackUrl**: Optional: The Activepieces webhook URL to receive the solution (Pingback).

### Using the Trigger (Callback Flow)
1. **Submit CAPTCHA**: In your workflow, use the **Solve CAPTCHA** action and provide a **Callback URL** (use the URL from your Activepieces Webhook trigger).
2. **Setup Trigger**: In a separate workflow (or the same one), use the **CAPTCHA Solver** piece as the trigger.
3. **Select Trigger**: Choose **CAPTCHA Solved (Webhook)**.
4. **Asynchronous Processing**: The workflow will now fire automatically when the service finishes solving the CAPTCHA.

## Triggers

### CAPTCHA Solved (Webhook)
Starts your workflow whenever a CAPTCHA solution is received via callback from a service (2Captcha, CapSolver, etc.).
- **Output**: Returns the `taskId`, `solution` token, and `receivedAt` timestamp.

## How to Use

1. **Get API Key**: Sign up for a CAPTCHA solving service (e.g., [2Captcha](https://2captcha.com/)) and obtain your API key.
2. **Add Step**: In your Activepieces workflow, add the **CAPTCHA Solver** piece.
3. **Configure Action**:
   - **Service**: Select your provider.
   - **API Key**: Enter your service API key.
   - **CAPTCHA Type**: Choose the type (reCAPTCHA v2/v3 or hCaptcha).
   - **Site Key**: Copy the `site-key` from the target website's HTML.
   - **Page URL**: Enter the full URL where the CAPTCHA is displayed.
4. **Use Solution**: The piece will output a `solution` (token). Map this token to the hidden CAPTCHA response field (usually `g-recaptcha-response` or `h-captcha-response`) in your form submission step.

## Actions

### Solve CAPTCHA
1. Send request to the selected service with siteKey and pageUrl.
2. Poll asynchronously for the solution.
3. Return the token or failure status to the workflow.

## Inputs
- **siteKey**: CAPTCHA site key (from target page).
- **pageUrl**: URL where CAPTCHA is located.
- **captchaType**: recaptcha_v2 / recaptcha_v3 / hcaptcha.
- **service**: Solving service (2captcha, anti-captcha, capsolver).
- **apiKey**: API key for selected service.

## Outputs
- **solution**: The CAPTCHA solution token.
- **errorMessage**: If solving fails, detailed error.

## Example Use Case

**Scenario**: You are automating a login to a portal that uses reCAPTCHA v2.

1. **Configure CAPTCHA Solver**:
   - **Service**: `2captcha`
   - **API Key**: `YOUR_2CAPTCHA_KEY`
   - **CAPTCHA Type**: `recaptcha_v2`
   - **Site Key**: `6Le-wvkSAAAAAPBqV...` (found in the page source)
   - **Page URL**: `https://portal.example.com/login`
2. **Next Step (HTTP Request/Puppeteer)**:
   - In your login form submission, map the `solution` from the previous step to the `g-recaptcha-response` field.
3. **Result**: The portal accepts the login as if a human solved the CAPTCHA.

**Scenario 2: Asynchronous Solving (Trigger)**
1. **Submit CAPTCHA**: Use the **Solve CAPTCHA** action. Set the **Callback URL** to your Activepieces webhook URL.
2. **Setup Trigger**: Use the **CAPTCHA Solved (Webhook)** trigger in your workflow.
3. **Automate**: Your workflow will now start automatically only when the service confirms the CAPTCHA is solved, saving you from long polling waits.

## Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Tests**:
   ```bash
   npm test
   ```
