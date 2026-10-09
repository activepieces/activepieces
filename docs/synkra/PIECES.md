# Adding a Piece to Synkra Flow

"Piece" in the code = "Integration" in the UI.

## 1. Create the folder

    packages/pieces/community/<name>/
      package.json
      src/index.ts
      src/lib/actions/*.ts
      src/lib/triggers/*.ts
      src/lib/auth.ts
      tsconfig.json
      tsconfig.lib.json

Package name must be scoped:
- Our own:      @synkra/piece-<name>
- Upstream:     @activepieces/piece-<name>

Reference: packages/pieces/community/synkra-chat

## 2. Link the workspace

    cd /root/synkra-flow
    bun install

## 3. Build the piece

    npx turbo run build --filter=@synkra/piece-<name> --force

Must produce clean dist/.

## 4. Bundle to .tgz

    npx tsx packages/cli/src/index.ts pieces bundle \
      packages/pieces/community/<name>
    cd dist && npm pack --json

Copy the .tgz into:
    packages/server/api/src/assets/synkra-pieces/

## 5. Register for boot install

Add the piece name to BUNDLED_PIECES in
packages/server/api/src/app/synkra/billing/bundled-pieces.service.ts

## 6. Make it visible in the picker

SQL the piece name into the default piece set's exceptions
(see HANDOVER Part 5).

## 7. Rebuild and deploy

    docker build -t synkra-flow:latest .
    docker compose -p synkraflow up -d --force-recreate app worker

## 8. Verify

    docker exec synkra-flow-postgres psql -U postgres -d activepieces -c \
      "SELECT name, version FROM piece_metadata WHERE name = '@synkra/piece-<name>';"

Open the builder. Piece should appear in the picker.

## Gotchas

- tsconfig.lib.json needs "outDir": "./dist" (relative, not absolute).
- CustomAuth pieces must pass auth.props to actions, not auth.
- Must use `tsx ... pieces bundle` — raw tsc output does not work at runtime.
