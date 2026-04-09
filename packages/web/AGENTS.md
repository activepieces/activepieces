# Web Frontend

You are working in the Activepieces web application (`packages/web`).

## Tech Stack

- **Framework**: React 18 with React Router v6
- **Build**: Vite
- **UI Components**: Shadcn/Radix UI (`src/components/ui/`)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS
- **Flow Builder**: XYFlow for visual flow editor
- **Internationalization**: i18next
- **Language**: TypeScript (strict)

## Project Structure

- `src/components/ui/` — Shared Shadcn/Radix UI primitives
- `src/features/` — Feature-based folders (flows, pieces, tables, auth, billing, etc.)
- `src/lib/` — Shared utilities and helpers
- `src/app/` — App-level routing and layout

## Tailwind / Styling

- **Always use `cn()` from `@/lib/utils` for className composition.** It uses `clsx` + `tailwind-merge` and handles conflicts and conditionals correctly. Never use template literals (`` `class-a ${someVar}` ``) or string concatenation for `className` props.
- **Never use negative margins** (`-mt-`, `-mb-`, `-mx-`, `-my-`, `-ml-`, `-mr-`, etc.). They introduce subtle layout bugs and make spacing hard to reason about. Use `gap`, `padding`, or `space-*` utilities instead.

## Components

- **Reuse existing components before creating new ones.** Before building a new component, search the repo for something that already covers the use case. Creating near-duplicate components for minor variations adds maintenance burden and visual inconsistency.
- **If an existing component isn't a perfect fit**, do not create a parallel one. Instead, propose extending the existing component (e.g. adding an optional prop) in a backwards-compatible way so existing usages are unaffected. Explain the trade-off to the user before making the change.

## React Hook Form

- **Zod error messages must use `formErrors`** — For standard validation messages (e.g. required fields) use the `formErrors` constant from `@activepieces/shared`. For custom messages, add the key to `packages/web/public/locales/en/translation.json` first, then use the key string. `FormMessage` automatically calls `t()` on every error message, so the string must be a valid translation key.
- **Always use `zodResolver`** — Wire the Zod schema directly to the form: `useForm({ resolver: zodResolver(MySchema) })`.
- **Always set `defaultValues`** — Prevents uncontrolled→controlled warnings and ensures clean resets. Derive them from a helper, not inline literals.
- **Use `mode: 'onChange'`** — Gives immediate validation feedback as the user types.
- **Reset forms via `key`, not `form.reset()`** — When a dialog or parent re-opens, pass a new `key` to the form component so React remounts it cleanly:
  ```tsx
  <MyForm key={open ? 'open' : 'closed'} />
  ```
- **Separate dialog state from form logic — apply this from the start** — The dialog component owns `open` state; the form is a separate child component. This makes `key`-based resets trivial. **Do this when first writing the dialog, not as a follow-up.** Every `<Dialog>` that contains a `useForm(...)` must be structured this way:
  ```tsx
  // ✅ Correct — dialog wrapper + keyed form child
  const MyDialog: React.FC<Props> = ({ open, onOpenChange }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <MyForm key={open ? 'open' : 'closed'} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
  ```
- **Always use `<FormField>` + `render` prop** — Wrap every field in `<FormField name="..." render={({ field }) => <FormItem>...</FormItem>} />`. Always include `<FormMessage />` inside `<FormItem>` to surface validation errors.
- **Use `form.watch()` for conditional rendering** — When a field value controls what other fields or UI is shown, use `form.watch('fieldName')`. Do not mirror form values into separate `useState`.
- **Use `form.setValue()` for cascading field updates** — When changing one field should reset or update related fields (e.g. selecting a provider resets its config), call `form.setValue()` inside the `onValueChange` handler.
- **Server errors go to `root.serverError`** — Set API errors with `form.setError('root.serverError', { type: 'manual', message: '...' })`. Clear it at the top of `handleSubmit` with `form.clearErrors('root.serverError')`. Render it below the fields, outside `<ScrollArea>`.
- **Wrap the `<form>` element in `<Form {...form}>`** — Always spread the form instance onto the Shadcn `<Form>` wrapper, and use `form.handleSubmit(handleSubmit)` on the native `<form>`. The submit button must be inside the `<form>` with `type="submit"`. Cancel buttons must always have `type="button"` to prevent accidental form submission.


## React Patterns

### `useEffect`

`useEffect` is an escape hatch for **synchronizing with external systems** (browser APIs, WebSockets, third-party libraries, DOM manipulation). See [React docs](https://react.dev/reference/react/useEffect).

**Never use `useEffect` for:**

- **Deriving state from props or other state** — Calculate the value directly in the component body.
- **Reacting to user interactions** — Use event handlers (`onClick`, `onSubmit`, etc.) instead.
- **Reinitializing component state when a prop changes** — Instead, have the parent pass a new `key` to the component, which makes React unmount and remount it cleanly:
  ```tsx
  // ✅ Parent controls reset by changing key
  <MyComponent key={someId} />
  ```
- **Listening to value changes to trigger other state updates** — Derive the value directly during render or handle it in the event handler that caused the change. A chain of `useEffect` → `setState` → `useEffect` is always a sign of a design problem.
- **Transforming data for rendering** — Calculate it inline during render instead.
- **Passing data upward to a parent** — Lift state up or use a shared store.

## Query Feature Guards

When a server endpoint is gated by `platformMustHaveFeatureEnabled` (returns HTTP 402 `FEATURE_DISABLED` when the plan lacks the feature), the corresponding `useQuery` hook **must** include `enabled: platform.plan.<flag>` so the request never fires when the feature is off. Without this, the global `QueryCache.onError` handler in `app.tsx` shows a misleading "Failed to load data" error dialog.

**Pattern** (see `secret-managers-hooks.ts`):
```ts
const { platform } = platformHooks.useCurrentPlatform();
return useQuery({
  queryKey: [...],
  queryFn: ...,
  enabled: platform.plan.someFeatureEnabled,
});
```

- `platformHooks.useCurrentPlatform()` returns instantly from cache (loaded by `InitialDataGuard`), safe to call in any hook.
- If the query already has an `enabled` condition, combine them: `enabled: !!existing && platform.plan.<flag>`.
- For pages with plan-gated content, also wrap with `LockedFeatureGuard` so users see an upgrade prompt instead of a broken/empty page.

## Guidelines

- Read existing code before making changes to understand patterns
- Reuse existing Shadcn/Radix components from `src/components/ui/` before creating new ones
- Follow existing feature folder conventions when adding new features
- Keep components focused and avoid over-engineering
