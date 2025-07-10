import { expect, test } from "@playwright/test"

// The account must be empty, and no flows should be present otherwise the test will fail and has a slack connection
const config = {
  email: process.env.E2E_EMAIL,
  password: process.env.E2E_PASSWORD,
  url: "https://cloud.activepieces.com/"
}

test("Test Send Slack message", async ({ page }) => {
  test.setTimeout(120000)

  await page.setExtraHTTPHeaders({ "Cache-Control": "no-cache" })
  await page.setExtraHTTPHeaders({ "ngrok-skip-browser-warning": "true" })

  await testSignIn(page, config)
  await page.getByRole("button", { name: "Webhook E2E" }).first().click()

  const newFlowButton = await page.getByRole("button", { name: "Create Flow" })

  await page.waitForSelector('button:has-text("Create Flow")')
  while ((await page.locator("span.text-muted-foreground").count()) > 1) {
    if (!(await page.locator("td:nth-child(7)").first().count())) break
    await page.locator("td:nth-child(7)").first().click()
    await page.getByRole("menuitem", { name: "Delete" }).click()
    const confirmButton = await page.getByRole("button", { name: "Remove" })
    await confirmButton.click()
    // Use waitFor to wait for the button to disappear
    await page.waitForSelector('button:has-text("Remove")', { state: "hidden" })
    await page.reload()
  }
  await newFlowButton.click()
  await page.getByText("From scratch").click()

  await page
    .locator('div[data-testid="rf__node-trigger"]')
    .filter({ hasText: "Select Trigger" })
    .click()
  await page.getByRole("textbox", { name: "Search" }).fill("Catch Webhook")
  await page.getByText("Catch Webhook").click()
  await page.waitForTimeout(2000)
  const webhookInput = await page.locator("input.grow.bg-background")
  const webhookUrl = await webhookInput.inputValue()
  const runVersion = Math.floor(Math.random() * 100000)
  const urlWithParams = `${webhookUrl}/sync?targetRunVersion=${runVersion}`
  // test webhook url
  await page.waitForTimeout(2000)
  await page.getByRole("button", { name: "Test Trigger Ctrl + G" }).click()
  await page.waitForTimeout(5000)
  const apiRequest = await page.context().request
  // Send a GET request to the webhook URL
  await apiRequest.get(urlWithParams)
  await page.waitForTimeout(5000)
  // Add Return response and fill body
  await page.locator("div.bg-light-blue").click()
  await page.getByRole("textbox", { name: "Search" }).fill("Return Response")
  await page.getByText("Return Response").nth(1).click()
  await page.waitForTimeout(3000)
  await page
    .locator("div.cm-activeLine.cm-line")
    .fill(
      "{\"targetRunVersion\": \"{{trigger['queryParams']['targetRunVersion']}}\"}",
    )
  // publish flow
  await page.waitForTimeout(1000)
  await page.getByRole("button", { name: "Publish" }).click()
  await page.waitForTimeout(25000)
  // test webhook
  const response = await apiRequest.get(urlWithParams)
  const body = await response.json()
  // match response [targetRunVersion] with runVersion
  expect(body["targetRunVersion"]).toBe(runVersion.toString())
  await page.goto(`${config.url}/flows`)
})

export async function testSignIn(
  page,
  config: { email: string; password: string; url: string },
) {
  await page.goto(`${config.url}/sign-in`)
  await page.getByPlaceholder("email@example.com").click()
  await page.getByPlaceholder("email@example.com").fill(config.email)
  await page.getByPlaceholder("********").click()
  await page.getByPlaceholder("********").fill(config.password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
}
