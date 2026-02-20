# How to Publish Your Piece

## Option 1: Contribute to Activepieces Community (Recommended)
If you want your piece to be available to everyone on Activepieces Cloud and the main repo:
1.  **Revert the package name** in `package.json` to `@heratshah/whatsapp-notifications-by-syncmate`.
2.  **Fork** the [Activepieces repository](https://github.com/activepieces/activepieces) on GitHub.
3.  **Push** your changes to your fork.
4.  **Open a Pull Request** against the `main` branch of `activepieces/activepieces`.
5.  Once merged, it will be available in the next release.

## Option 2: Publish to NPM (For Private/Custom Use)
If you want to use this piece immediately on your self-hosted instance without waiting for a PR merge:

1.  **Ensure you are logged in to NPM**:
    ```bash
    npm login
    ```

2.  **Build the piece** (already done):
    ```bash
    npx nx build whatsapp-notifications-by-syncmate
    ```

3.  **Navigate to the dist folder**:
    ```bash
    cd dist/packages/pieces/community/whatsapp-notifications-by-syncmate
    ```

4.  **Publish**:
    ```bash
    npm publish --access public
    ```
    *Note: Ensure the package name in `package.json` is unique on NPM (e.g., `whatsapp-notifications-by-syncmate`).*

5.  **Install on Activepieces**:
    - Set the environment variable `AP_PIECES_SOURCE` to `NPM` (or `FILE` if mapping locally).
    - If using NPM source, add your package name to `AP_PIECES` list or install it manually.

## Option 3: Local Deployment (Already Configured)
You are currently running in **Local Dev Mode** (`AP_PIECES_SOURCE='FILE'`).
- The piece is loaded directly from the `dist` folder.
- You don't need to publish to NPM for local development.
- Just run `npm run dev` and refresh your browser.
