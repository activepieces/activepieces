# How to Deploy Your Piece

## Option 1: Contribute to Activepieces (Recommended for Public Availability)
To make your piece available to everyone on Activepieces Cloud and the main repository:

1.  **Fork** the [Activepieces repository](https://github.com/activepieces/activepieces).
2.  **Commit** your changes to a new branch.
3.  **Push** the branch to your fork.
4.  **Create a Pull Request (PR)** against the `main` branch of the official repository.
5.  Once reviewed and merged, your piece will appear in the next release.

## Option 2: Deploy to Your Self-Hosted Instance
If you are running your own Activepieces instance:

1.  **Build the piece**:
    ```bash
    npx nx build whatsapp-notifications-by-syncmate
    ```
    This creates the output in `dist/packages/pieces/community/whatsapp-notifications-by-syncmate`.

2.  **Configure Activepieces**:
    - Ensure `AP_PIECES_SOURCE` environment variable is set to `FILE`.
    - Ensure `AP_DEV_PIECES` includes `whatsapp-notifications-by-syncmate`.

3.  **Restart Activepieces**:
    - Run `npm run start` or restart your Docker container.
    - Your piece will be loaded from the local file system.

## Option 3: Publish as a Custom NPM Package
If you want to install this piece on other instances without merging into the core:

1.  **Rename the package** in `packages/pieces/community/whatsapp-notifications-by-syncmate/package.json`:
    - Change `"name": "@activepieces/piece-whatsapp-notifications-by-syncmate"` to something unique, e.g., `"my-whatsapp-notifications-by-syncmates"`.

2.  **Build**:
    ```bash
    npx nx build pieces-whatsapp-notifications-by-syncmate
    ```

3.  **Publish to NPM**:
    ```bash
    cd dist/packages/pieces/community/whatsapp-notifications-by-syncmate
    npm login
    npm publish --access public
    ```

4.  **Install on Activepieces**:
    - Set `AP_PIECES_SOURCE=NPM` in your environment variables.
    - Add your package name to `AP_PIECES` env var (if manual list is used) or install it via the admin panel (if supported).
