/**
 * Process the directory URL to ensure proper formatting and requests.
 *
 * @param {string} url directory site url
 * @returns {string} formatted url
 */
export function parseDirectoryURL(url: string) {
  let formattedUrl = url;

  // Ensure the URL starts with "https://"
  if (!formattedUrl.startsWith('https://')) {
    // If the URL starts with "http://", replace it with "https://"
    // Otherwise, prepend "https://" to the URL
    formattedUrl = formattedUrl.startsWith('http://')
      ? formattedUrl.replace('http://', 'https://')
      : 'https://' + formattedUrl;
  }

  // Ensure the URL ends with "/api"
  if (!formattedUrl.endsWith('/api')) {
    // If the URL ends with a slash, append "api" to the URL
    // Otherwise, append "/api" to the URL
    formattedUrl += formattedUrl.endsWith('/') ? 'api' : '/api';
  }

  return formattedUrl;
}
