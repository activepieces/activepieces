import { defineConfig } from 'checkly'
import { AlertEscalationBuilder, RetryStrategyBuilder } from 'checkly/constructs'

/**
 * See https://www.checklyhq.com/docs/cli/project-structure/
 */
const config = defineConfig({
  /* A human friendly name for your project */
  projectName: `E2E (${process.env.E2E_CONFIG_MODE})`,
  /** A logical ID that needs to be unique across your Checkly account,
   * See https://www.checklyhq.com/docs/cli/constructs/ to learn more about logical IDs.
   */
  logicalId: `activepieces-e2e-tests-${process.env.E2E_CONFIG_MODE}`,
  /* An optional URL to your Git repo to be shown in your test sessions and resource activity log */
  /* repoUrl: 'https://github.com/checkly/checkly-cli', */
  /* Sets default values for Checks */
  checks: {
    /* A default for how often your Check should run in minutes */
    frequency: 10,
    /* Checkly data centers to run your Checks as monitors */
    locations: ['us-east-1', 'eu-west-1'],
    /** The Checkly Runtime identifier, determining npm packages and the Node.js version available at runtime.
     * See https://www.checklyhq.com/docs/cli/npm-packages/
     */

    runtimeId: '2024.09',
    /* Failed check runs will be retried before triggering alerts */
    retryStrategy: RetryStrategyBuilder.fixedStrategy({ baseBackoffSeconds: 60, maxRetries: 4, sameRegion: true }),
    /* A glob pattern that matches the Checks inside your repo, see https://www.checklyhq.com/docs/cli/using-check-test-match/ */
    checkMatch: '**/scenarios/**/*.check.ts',
    /* All checks will have this alert escalation policy defined */
    alertEscalationPolicy: AlertEscalationBuilder.runBasedEscalation(1),
    /* Global configuration option for Playwright-powered checks. See https://www.checklyhq.com/docs/browser-checks/playwright-test/#global-configuration */
    playwrightConfig: {
      use: {
        baseURL: 'https://cloud.activepieces.com',
        viewport: { width: 1280, height: 720 },
      }
    },
    browserChecks: {
      /* A glob pattern matches any Playwright .spec.ts files and automagically creates a Browser Check. This way, you
      * can just write native Playwright code. See https://www.checklyhq.com/docs/cli/using-check-test-match/
      * */
      testMatch: '**/scenarios/**/*.spec.ts',
    },
  },
  cli: {
    /* The default datacenter location to use when running npx checkly test */
    runLocation: 'eu-west-1',
    /* An array of default reporters to use when a reporter is not specified with the "--reporter" flag */
    reporters: ['list'],
    /* How many times to retry a failing test run when running `npx checkly test` or `npx checkly trigger` (max. 3) */
    retries: 2,
  },
})

export default config
