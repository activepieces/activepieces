    /**
     * Custom HTML plugin options.
     * @typedef {Object} CustomHtmlPluginOptions
     * @property {string} title - The title to be injected into the HTML.
     * @property {string} icon - The icon URL to be set as the favicon.
     */

    /**
     * @param {CustomHtmlPluginOptions} options
     */
    export default function customHtmlPlugin(options) {
      return {
        name: 'custom-html',
          transformIndexHtml(html) {
            let newHtml = html.replace(/<%= apTitle %>/g, options.title || '');
            
            newHtml = newHtml.replace(/<%= apFavicon %>/g, options.icon || '');

            return newHtml;
          },
        };
    }