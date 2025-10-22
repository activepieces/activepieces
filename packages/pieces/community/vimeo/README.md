# pieces-vimeo

## How to create an API app
1. Log into your Vimeo account at https://developer.vimeo.com
2. Select **Create an app** in the upper right-hand corner, or visit: https://developer.vimeo.com/apps/new
3. Enter a name and description for your app
4. Select Create app

### Generate personal access token
1. After creating the app, navigate to https://developer.vimeo.com/apps
2. Select your app
3. Scroll and find **Authentication** -> **Generate an access token**
4. Select **Authenticated (you)**
5. Select this scope:
 - Private
 - Delete
 - Upload (you need to request for upload access)
 - Video Files
6. Click the **Generate** button
7. Copy the created token

### To request API upload access:
1. Visit the My Apps page
2. Select the name of your app
3. On your app's information page, under the Permissions section, select the **Request Upload Access** link and fill the required information.
4. Or you can also submit a [support ticket](https://vimeo.com/help/contact) requesting Vimeo API upload access