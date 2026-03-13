# Web Package — Coding Rules

## Tailwind / Styling

- **Always use `cn()` from `@/lib/utils` for className composition.** It uses `clsx` + `tailwind-merge` and handles conflicts and conditionals correctly. Never use template literals (`` `class-a ${someVar}` ``) or string concatenation for `className` props.
- **Never use negative margins** (`-mt-`, `-mb-`, `-mx-`, `-my-`, `-ml-`, `-mr-`, etc.). They introduce subtle layout bugs and make spacing hard to reason about. Use `gap`, `padding`, or `space-*` utilities instead.

## Components

- **Reuse existing components before creating new ones.** Before building a new component, search the repo for something that already covers the use case. Creating near-duplicate components for minor variations adds maintenance burden and visual inconsistency.
- **If an existing component isn't a perfect fit**, do not create a parallel one. Instead, propose extending the existing component (e.g. adding an optional prop) in a backwards-compatible way so existing usages are unaffected. Explain the trade-off to the user before making the change.

## React Patterns

### `useEffect`

`useEffect` is an escape hatch for **synchronizing with external systems** (browser APIs, WebSockets, third-party libraries, DOM manipulation). See [React docs](https://react.dev/reference/react/useEffect).

- **Do NOT use `useEffect` to derive state from props or other state.** Calculate the value directly in the component body instead.
- **Do NOT use `useEffect` to react to user interactions.** Use event handlers.
- **Do NOT use `useEffect` to reset component state when a prop changes.** Instead, change the component's `key` prop so React mounts a fresh instance. See the pattern in [reconnect-button-dialog.tsx](src/app/connections/reconnect-button-dialog.tsx):
  ```tsx
  <CreateOrEditConnectionDialog
    key={`dialog-${open}`}
    ...
  />
  ```


