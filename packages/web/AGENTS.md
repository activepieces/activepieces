# Web Frontend

React 18 + Vite + Shadcn/Radix + Zustand + TanStack Query + React Hook Form + Tailwind + XYFlow + i18next.

## Patterns (Reference Real Code)

- **Feature folder**: `src/features/{name}/api/`, `hooks/`, `components/`, `stores/`. See `features/tables/`.
- **API client**: `api.get()`, `api.post()`, `api.delete()` from `@/lib/api`. Updates use POST (not PUT). See `features/tables/api/tables-api.ts`.
- **Hooks**: Separate query and mutation exports. See `features/tables/hooks/table-hooks.ts`.
- **Route**: `React.lazy()` + `ProjectRouterWrapper()` + `RoutePermissionGuard` + `SuspenseWrapper` + `PageTitle`. See `app/routes/project-routes.tsx`.

## Non-Obvious Rules

- **Form reset**: Use `key` prop, NOT `form.reset()`. WHY: prevents stale form state across dialog open/close cycles.
- **Server errors**: `form.setError('root.serverError', {...})`. WHY: `FormMessage` auto-calls `t()` on error strings, so values must be translation keys.
- **Conditional fields**: Use `form.watch()`, NOT separate `useState`.
- **Cascading updates**: Use `form.setValue()` in `onValueChange`, NOT `useEffect`.
- **No negative margins**: Use `gap`, `padding`, or `space-*` instead.
- **Embedding**: Check `EmbeddingState` context from `embed-provider.tsx` when building UI that may be embedded (`isEmbedded`, `hideSideNav`, `hidePageHeader`, etc.).
- **Feature flags**: `flagsHooks.useFlag<T>(ApFlagId.X)`. Gate sections with `<FlagGuard flag={flagId}>`.
- **i18n**: All strings through `t()`. Add keys to `packages/web/public/locales/en/translation.json` only.
- **className**: Always use `cn()` from `@/lib/utils` for composition.
