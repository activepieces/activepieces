# tsconfig.base.json Registration

To make the monorepo TypeScript resolve `@activepieces/piece-ninjapipe`, add this path to the root `tsconfig.base.json` under `compilerOptions.paths` (insert alphabetically):

```json
"@activepieces/piece-ninjapipe": ["packages/pieces/community/ninjapipe/src/index.ts"]
```
