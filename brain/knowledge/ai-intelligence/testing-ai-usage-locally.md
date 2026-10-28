---
icon: 🧪
---
# Testing AI Usage Locally

How to see AI calls go to Autumn and land in the usage tables on a dev box. The copy job only runs in Cloud and Enterprise, and only for platforms with Autumn credentials.

1. Run with `AP_EDITION=ee` and `npm run dev`.
2. If your dev database ran an older version of migration `AddAiUsageTables1877000000000`, drop `ai_usage_ingest_cursor`, `ai_usage_5m` and `ai_usage_daily`, delete that row from `migrations`, and restart so the current version runs.
3. In the Autumn **sandbox**:
   - create a customer **with an ID**. One created without an ID shows `PENDING` and can't be used;
   - attach the Free plan;
   - create a secret key (`am_sk_test_…`) under Developer → API Keys;
   - check that the credits feature id is `apCredits`.
4. On your platform:
   ```sql
   UPDATE "platform_plan" SET "autumnCustomerId" = '<id>', "autumnApiKey" = 'am_sk_test_…', "aiProvidersEnabled" = true WHERE "platformId" = '<platform id>';
   ```
5. Wait for one `aiUsageCopy` log line: the first run only creates the cursor. Then make calls: a chat message, a test step, a published run, and one call on your own key.
6. In Autumn each call is an event with `properties.usage` (v1). Own-key calls in a chat turn show `source: ai_usage` and value 0. Events without `usage`, such as `flow_run`, are skipped.
7. After about 3 minutes (2-minute delay + the one-minute job), check `ai_usage_5m`, `ai_usage_daily`, `ai_usage_copy_cursor` and `ai_usage_run`. A row is a total per 5-minute slot or day per series, so compare `sum("calls")` with the number of events, not the row count.
