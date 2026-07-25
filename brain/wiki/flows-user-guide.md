---
icon: 🔀
---

# Flows (User Guide)

The no-code flow builder concepts for end users. Source: `docs/flows/`.

## Building flows
A flow has two parts: a **Trigger** (the starting point that sets execution frequency — Schedule, Webhook, or service Event) and **Actions** (what runs when triggered — run code, call services). A flow is a vertical diagram: one trigger followed by any number of action steps.

## Passing data
Data flows top-down from parent steps to children; each step can access the output of its ancestors. Place your cursor in any input to open the **Data to Insert** panel and click items to insert them (mix static text and dynamic data). Steps must be **tested first** to generate sample data before their output can be referenced — via Load Data, Test Trigger, Send Data (webhooks), or Test Action.
- Switch dropdowns/other inputs to a dynamic value to reference previous steps.
- Reference data by path with `{{step_slug.path.to.property}}`; the `step_slug` appears when hovering a step.

## Other pages
- **Using formulas** and **Formula reference** — expressions in inputs.
- **Publishing flows** — activate a flow version.
- **Debugging runs** — inspect run results and failures.
- **Versioning** — flow versions and history.
