import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfcrowdAuth } from '../common/auth';
import { getAuthHeader, getConvertUrl } from '../common/client';
import FormData from 'form-data';

export const htmlToPdfAction = createAction({
  name: 'html_to_pdf',
  displayName: 'Convert HTML to PDF',
  description: 'Convert HTML content (string) to PDF document',
  auth: pdfcrowdAuth,
  props: {
    htmlContent: Property.LongText({
      displayName: 'HTML Content',
      description: 'The HTML content to convert to PDF',
      required: true,
    }),
    outputFilename: Property.ShortText({
      displayName: 'Output Filename',
      description: 'The filename for the generated PDF',
      required: false,
      defaultValue: 'document.pdf',
    }),
    page_size: Property.StaticDropdown({
      displayName: 'Page Size',
      description: 'Set the output page size using standard formats (A4, Letter, A3, etc.). Use A4 for international documents, Letter for US-based content, or larger sizes like A3 for posters and presentations.',
      required: false,
      options: {
        options: [
          { label: 'A0', value: 'A0' },
          { label: 'A1', value: 'A1' },
          { label: 'A2', value: 'A2' },
          { label: 'A3', value: 'A3' },
          { label: 'A4', value: 'A4' },
          { label: 'A5', value: 'A5' },
          { label: 'A6', value: 'A6' },
          { label: 'Letter', value: 'Letter' },
        ],
      },
      defaultValue: 'A4',
    }),
    page_width: Property.ShortText({
      displayName: 'Page Width',
      description: 'Set custom page dimensions when standard sizes don\'t fit your needs. Useful for banners, receipts, custom forms, or when matching specific printing equipment. The safe maximum is 200in - larger sizes may fail to open in some PDF viewers. For standard sizes like A4 or Letter, use the predefined page size option instead.',
      required: false,
      defaultValue: '8.27in',
    }),
    page_height: Property.ShortText({
      displayName: 'Page Height',
      description: 'Set custom page height for specific formats like receipts, banners, or legal documents. Set to "-1" for a single-page PDF that expands to fit all content vertically - ideal for web pages, infographics, or documents where page breaks are undesirable. The safe maximum is 200in otherwise some viewers cannot open the PDF. For standard sizes, use the predefined page size option instead.',
      required: false,
      defaultValue: '11.7in',
    }),
    orientation: Property.StaticDropdown({
      displayName: 'Orientation',
      description: 'Set the output page orientation to portrait or landscape. Use landscape for wide content like spreadsheets, charts, or dashboards. Use portrait for standard documents and text-heavy content.',
      required: false,
      options: {
        options: [
          { label: 'landscape', value: 'landscape' },
          { label: 'portrait', value: 'portrait' },
        ],
      },
      defaultValue: 'portrait',
    }),
    margin_top: Property.ShortText({
      displayName: 'Margin Top',
      description: 'Control white space at the top of the page. Increase for header space, formal documents, or annotation room (e.g., 1in or more). Decrease to maximize content area or fit more content (e.g., 5mm to 10mm). Default 0.4in balances readability with space efficiency. Set to 0 for full-bleed designs. Affects where content starts and where headers appear.',
      required: false,
      defaultValue: '0.4in',
    }),
    margin_right: Property.ShortText({
      displayName: 'Margin Right',
      description: 'Control white space on the right edge of the page. Increase for binding/hole-punch clearance or note-taking space (e.g., 1in or more). Decrease to fit wider content (e.g., 5mm to 10mm). Default 0.4in balances readability with space efficiency. Set to 0 for full-bleed designs. Affects where content wraps and text line length.',
      required: false,
      defaultValue: '0.4in',
    }),
    margin_bottom: Property.ShortText({
      displayName: 'Margin Bottom',
      description: 'Control white space at the bottom of the page. Increase for footer space, page numbers, or formal documents (e.g., 1in or more). Decrease to fit more content per page (e.g., 5mm to 10mm). Default 0.4in balances readability with space efficiency. Set to 0 for full-bleed designs. Affects where content ends and where footers appear.',
      required: false,
      defaultValue: '0.4in',
    }),
    margin_left: Property.ShortText({
      displayName: 'Margin Left',
      description: 'Control white space on the left edge of the page. Increase for binding/hole-punch clearance or note-taking space (e.g., 1in or more). Decrease to fit wider content (e.g., 5mm to 10mm). Default 0.4in balances readability with space efficiency. Set to 0 for full-bleed designs. Affects where content starts horizontally and text line length.',
      required: false,
      defaultValue: '0.4in',
    }),
    no_margins: Property.Checkbox({
      displayName: 'No Margins',
      description: 'Disable all page margins to use the entire page area. Use this for full-bleed designs where content should extend to the page edges, such as posters, certificates, or branded materials. Combine with custom CSS to ensure your content fills the page properly.',
      required: false,
    }),
    print_page_range: Property.ShortText({
      displayName: 'Print Page Range',
      description: 'Set the page range to print when you only need specific pages from the conversion. Use this to extract individual pages (e.g., "2"), specific ranges (e.g., "3-7"), or combinations (e.g., "1,4-6,last"). Ideal for creating excerpts from long documents or excluding cover pages from batch processing.',
      required: false,
    }),
    content_viewport_width: Property.StaticDropdown({
      displayName: 'Content Viewport Width',
      description: 'Set the viewport width for formatting the HTML content when generating a PDF. Use this to control how responsive designs render - prevent mobile styles from applying when you want desktop layout, or ensure content appears at the right width. Specify a viewport width to control content rendering, ensuring it mimics the appearance on various devices or matches specific design requirements.',
      required: false,
      options: {
        options: [
          { label: 'balanced', value: 'balanced' },
          { label: 'small', value: 'small' },
          { label: 'medium', value: 'medium' },
          { label: 'large', value: 'large' },
          { label: 'extra-large', value: 'extra-large' },
        ],
      },
      defaultValue: 'medium',
    }),
    content_viewport_height: Property.StaticDropdown({
      displayName: 'Content Viewport Height',
      description: 'Set the viewport height for formatting the HTML content when generating a PDF. Specify a viewport height to enforce loading of lazy-loaded images and affect vertical positioning of absolutely positioned elements within the content.',
      required: false,
      options: {
        options: [
          { label: 'auto', value: 'auto' },
          { label: 'large', value: 'large' },
        ],
      },
      defaultValue: 'auto',
    }),
    content_fit_mode: Property.StaticDropdown({
      displayName: 'Content Fit Mode',
      description: 'Specify the mode for fitting the HTML content to the print area by upscaling or downscaling it. Use this to prevent content from being cut off at page edges or to enable smart scaling of oversized content.',
      required: false,
      options: {
        options: [
          { label: 'auto', value: 'auto' },
          { label: 'smart-scaling', value: 'smart-scaling' },
          { label: 'no-scaling', value: 'no-scaling' },
          { label: 'viewport-width', value: 'viewport-width' },
          { label: 'content-width', value: 'content-width' },
          { label: 'single-page', value: 'single-page' },
          { label: 'single-page-ratio', value: 'single-page-ratio' },
        ],
      },
      defaultValue: 'auto',
    }),
    remove_blank_pages: Property.StaticDropdown({
      displayName: 'Remove Blank Pages',
      description: 'Specify which blank pages to exclude from the output document to create cleaner PDFs. Use "trailing" to remove empty pages at the end caused by page break issues. Use "all" to remove blank pages throughout the document when converting content with formatting quirks. Helps eliminate unwanted white pages from the final output.',
      required: false,
      options: {
        options: [
          { label: 'trailing', value: 'trailing' },
          { label: 'all', value: 'all' },
          { label: 'none', value: 'none' },
        ],
      },
      defaultValue: 'trailing',
    }),
    header_url: Property.LongText({
      displayName: 'Header URL',
      description: 'Load an HTML code from the specified URL and use it as the page header.',
      required: false,
    }),
    header_html: Property.LongText({
      displayName: 'Header HTML',
      description: 'Set the HTML header content with custom styling and dynamic page numbers. Use this to add page numbers, document titles, author names, dates, or company branding to the top of every page. Supports full HTML/CSS for complete design control. Use special CSS classes like pdfcrowd-page-number and pdfcrowd-page-count for dynamic content. Ideal for reports, invoices, and professional documents.',
      required: false,
    }),
    header_height: Property.ShortText({
      displayName: 'Header Height',
      description: 'Set the header height to allocate space for header content and prevent overlap with main content. Increase this if your header text is getting cut off or overlapping with page content. Must be large enough to accommodate your header HTML including any multi-line text or images.',
      required: false,
      defaultValue: '0.5in',
    }),
    footer_url: Property.LongText({
      displayName: 'Footer URL',
      description: 'Load an HTML code from the specified URL and use it as the page footer.',
      required: false,
    }),
    footer_html: Property.LongText({
      displayName: 'Footer HTML',
      description: 'Set the HTML footer content with custom styling and dynamic page numbers. Use this to add page numbers, copyright notices, document dates, or company information to the bottom of every page. Supports full HTML/CSS for complete design control. Use special CSS classes like pdfcrowd-page-number and pdfcrowd-page-count for dynamic content. Ideal for contracts, reports, and official documents.',
      required: false,
    }),
    footer_height: Property.ShortText({
      displayName: 'Footer Height',
      description: 'Set the footer height to allocate space for footer content and prevent overlap with main content. Increase this if your footer text is getting cut off or overlapping with page content. Must be large enough to accommodate your footer HTML including any multi-line text or images.',
      required: false,
      defaultValue: '0.5in',
    }),
    no_header_footer_horizontal_margins: Property.Checkbox({
      displayName: 'No Header Footer Horizontal Margins',
      description: 'Disable horizontal page margins for header and footer. The header/footer contents width will be equal to the physical page width.',
      required: false,
    }),
    exclude_header_on_pages: Property.ShortText({
      displayName: 'Exclude Header On Pages',
      description: 'The page header content is not printed on the specified pages. To remove the entire header area, use the conversion config.',
      required: false,
    }),
    exclude_footer_on_pages: Property.ShortText({
      displayName: 'Exclude Footer On Pages',
      description: 'The page footer content is not printed on the specified pages. To remove the entire footer area, use the conversion config.',
      required: false,
    }),
    header_footer_scale_factor: Property.Number({
      displayName: 'Header Footer Scale Factor',
      description: 'Set the scaling factor (zoom) for the header and footer.',
      required: false,
      defaultValue: 100,
    }),
    page_numbering_offset: Property.Number({
      displayName: 'Page Numbering Offset',
      description: 'Set the numbering offset for page numbers in header/footer HTML to continue page numbering from a previous document. Use this when generating document sections separately - for example, if you have already generated pages 1-10, set offset to 10. The next section will then start numbering at page 11. Essential for multi-part reports or book chapters.',
      required: false,
    }),
    page_watermark_url: Property.ShortText({
      displayName: 'Page Watermark URL',
      description: 'Load a file from the specified URL and apply the file as a watermark to each page of the output PDF. A watermark can be either a PDF or an image. If a multi-page file (PDF or TIFF) is used, the first page is used as the watermark.',
      required: false,
    }),
    multipage_watermark_url: Property.ShortText({
      displayName: 'Multipage Watermark URL',
      description: 'Load a file from the specified URL and apply each page of the file as a watermark to the corresponding page of the output PDF. A watermark can be either a PDF or an image.',
      required: false,
    }),
    page_background_url: Property.ShortText({
      displayName: 'Page Background URL',
      description: 'Load a file from the specified URL and apply the file as a background to each page of the output PDF. A background can be either a PDF or an image. If a multi-page file (PDF or TIFF) is used, the first page is used as the background.',
      required: false,
    }),
    multipage_background_url: Property.ShortText({
      displayName: 'Multipage Background URL',
      description: 'Load a file from the specified URL and apply each page of the file as a background to the corresponding page of the output PDF. A background can be either a PDF or an image.',
      required: false,
    }),
    page_background_color: Property.ShortText({
      displayName: 'Page Background Color',
      description: 'Set a solid background color for all pages, filling the entire page area including margins. Useful for creating branded PDFs with corporate colors, highlighting draft documents, or improving readability with off-white backgrounds. Supports transparency with RGBA format - use semi-transparent colors for subtle effects without obscuring content. Format as RGB (FF0000) or RGBA (FF000080) hexadecimal.',
      required: false,
    }),
    use_print_media: Property.Checkbox({
      displayName: 'Use Print Media',
      description: 'Use the print version of the page if available via @media print CSS rules. Enable this when converting websites that have print-optimized styles. Many sites hide navigation, ads, and sidebars in print mode. Produces cleaner PDFs by using the design the website creator intended for printing.',
      required: false,
    }),
    no_background: Property.Checkbox({
      displayName: 'No Background',
      description: 'Do not print the background graphics to create printer-friendly PDFs. Use this when documents will be physically printed to save ink costs and improve readability. Removes background colors, images, and patterns while preserving text and foreground content. Particularly useful for documents with dark backgrounds or decorative elements.',
      required: false,
    }),
    disable_javascript: Property.Checkbox({
      displayName: 'Disable JavaScript',
      description: 'Do not execute JavaScript during conversion. Use this to improve conversion speed when JavaScript is not needed, prevent dynamic content changes, or avoid security risks from untrusted scripts. Note that disabling JavaScript means lazy-loaded images and AJAX content will not load.',
      required: false,
    }),
    disable_image_loading: Property.Checkbox({
      displayName: 'Disable Image Loading',
      description: 'Do not load images during conversion to create text-only PDFs. Use this to significantly speed up conversion, reduce file size, or create accessible text-focused documents. Ideal for converting documentation where images are not needed, reducing bandwidth usage, or creating lightweight PDFs for email distribution.',
      required: false,
    }),
    disable_remote_fonts: Property.Checkbox({
      displayName: 'Disable Remote Fonts',
      description: 'Disable loading fonts from remote sources. Use this to speed up conversion by avoiding font download delays, ensure consistent rendering with system fonts, or work around font loading failures. Note that text will fall back to system fonts, which may change the document\'s appearance.',
      required: false,
    }),
    load_iframes: Property.StaticDropdown({
      displayName: 'Load Iframes',
      description: 'Specifies how iframes are handled during conversion. Use "all" to include all embedded content (videos, maps, widgets). Use "same-origin" to include only content from the same domain for security purposes. Use "none" to exclude all iframes for faster conversion and to avoid third-party content issues. Disabling iframes can significantly improve performance and reliability.',
      required: false,
      options: {
        options: [
          { label: 'all', value: 'all' },
          { label: 'same-origin', value: 'same-origin' },
          { label: 'none', value: 'none' },
        ],
      },
      defaultValue: 'all',
    }),
    block_ads: Property.Checkbox({
      displayName: 'Block Ads',
      description: 'Automatically block common advertising networks and tracking scripts during conversion, producing cleaner PDFs with faster conversion times. Filters out third-party ad content, analytics beacons, and ad network resources. Ideal for converting news sites, blogs, or any ad-heavy content where ads distract from the main message. May occasionally block legitimate third-party content - disable if critical third-party resources are missing.',
      required: false,
    }),
    default_encoding: Property.ShortText({
      displayName: 'Default Encoding',
      description: 'Specify the character encoding when the HTML lacks proper charset declaration or has incorrect encoding. Prevents garbled text for non-English content, especially legacy pages without UTF-8 encoding. Set to "utf-8" for modern content, "iso-8859-1" for Western European legacy pages, or other encodings for specific regional content. Only needed when auto-detection fails and you see corrupted characters in the output.',
      required: false,
      defaultValue: 'auto detect',
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Set the locale for the conversion to control regional formatting of dates, times, and numbers. Use this when converting content for specific regions - for example, set to "en-US" for MM/DD/YYYY dates and comma thousand separators, or "de-DE" for DD.MM.YYYY dates and period thousand separators. Essential for financial reports, invoices, or localized content.',
      required: false,
      defaultValue: 'en-US',
    }),
    http_auth_user_name: Property.ShortText({
      displayName: 'HTTP Auth User Name',
      description: 'Set the HTTP authentication user name. Required to access protected web pages or staging environments.',
      required: false,
    }),
    http_auth_password: Property.ShortText({
      displayName: 'HTTP Auth Password',
      description: 'Set the HTTP authentication password. Required to access protected web pages or staging environments.',
      required: false,
    }),
    cookies: Property.ShortText({
      displayName: 'Cookies',
      description: 'Set HTTP cookies to be included in all requests made by the converter to access authenticated or session-based content. Use this when converting pages that require login, maintain user sessions, or personalize content based on cookies. Essential for converting member-only areas, dashboards, or any content behind cookie-based authentication. Format as semicolon-separated name=value pairs.',
      required: false,
    }),
    verify_ssl_certificates: Property.Checkbox({
      displayName: 'Verify SSL Certificates',
      description: 'Enforce SSL certificate validation for secure connections, preventing conversions from sites with invalid certificates. Enable when converting from production sites with valid certificates to ensure security. When disabled, allows conversion from any HTTPS site regardless of certificate validity - including development servers with self-signed certificates, internal corporate sites with expired certificates, or local testing environments.',
      required: false,
    }),
    fail_on_main_url_error: Property.Checkbox({
      displayName: 'Fail On Main URL Error',
      description: 'Abort the conversion if the HTTP status code of the main URL is greater than or equal to 400 (client/server errors). Use this in automated workflows to catch broken URLs or authentication failures early rather than producing invalid PDFs. Ensures your system does not silently generate error page PDFs when source content is unavailable.',
      required: false,
    }),
    fail_on_any_url_error: Property.Checkbox({
      displayName: 'Fail On Any URL Error',
      description: 'Abort the conversion if any sub-request (images, stylesheets, scripts) fails with HTTP 400+ errors. Use this for strict quality control when all assets must load successfully.',
      required: false,
    }),
    css_page_rule_mode: Property.StaticDropdown({
      displayName: 'CSS Page Rule Mode',
      description: 'Specifies behavior in the presence of CSS @page rules to control which settings take precedence. Use "default" to prioritize API settings over CSS rules, ensuring consistent output regardless of input HTML. Use "mode2" to respect CSS @page rules for print-optimized HTML. This solves conflicts when CSS tries to override your API page setup.',
      required: false,
      options: {
        options: [
          { label: 'default', value: 'default' },
          { label: 'mode1', value: 'mode1' },
          { label: 'mode2', value: 'mode2' },
        ],
      },
      defaultValue: 'default',
    }),
    custom_css: Property.LongText({
      displayName: 'Custom CSS',
      description: 'Apply custom CSS to the input HTML document to modify the visual appearance and layout of your content dynamically. Use this to override default styles, adjust spacing, change fonts, or fix layout issues without modifying the source HTML. Use !important in your CSS rules to prioritize and override conflicting styles.',
      required: false,
    }),
    custom_javascript: Property.LongText({
      displayName: 'Custom JavaScript',
      description: 'Run a custom JavaScript after the document is loaded and ready to print. Use this to modify page content before conversion, remove unwanted elements, or trigger specific page states. The script is intended for post-load DOM manipulation (add/remove elements, update CSS, ...). In addition to the standard browser APIs, the custom JavaScript code can use helper functions from our JavaScript library.',
      required: false,
    }),
    on_load_javascript: Property.ShortText({
      displayName: 'On Load JavaScript',
      description: 'Run a custom JavaScript right after the document is loaded. The script is intended for early DOM manipulation (add/remove elements, update CSS, ...). In addition to the standard browser APIs, the custom JavaScript code can use helper functions from our JavaScript library.',
      required: false,
    }),
    custom_http_header: Property.ShortText({
      displayName: 'Custom HTTP Header',
      description: 'Set a custom HTTP header to be included in all requests made by the converter. Use this to pass authentication tokens to protected sites, add tracking headers for analytics, or provide API keys for accessing private content. Essential when converting content from APIs or internal systems that require special headers for access control.',
      required: false,
    }),
    javascript_delay: Property.Number({
      displayName: 'JavaScript Delay',
      description: 'Wait the specified number of milliseconds to finish all JavaScript after the document is loaded. Use this to ensure lazy-loaded images, AJAX content, or animations complete before conversion. Your license defines the maximum wait time by "Max Delay" parameter.',
      required: false,
      defaultValue: 200,
    }),
    element_to_convert: Property.ShortText({
      displayName: 'Element To Convert',
      description: 'Convert only the specified element from the main document and its children. Use this to extract specific portions of a page (like article content) while excluding navigation, headers, footers, or sidebars. The element is specified by one or more CSS selectors. If the element is not found, the conversion fails. If multiple elements are found, the first one is used.',
      required: false,
    }),
    element_to_convert_mode: Property.StaticDropdown({
      displayName: 'Element To Convert Mode',
      description: 'Control how CSS styles are applied when converting only part of a page. The "cut-out" option extracts the element into a new document root, which may break CSS selectors like "body > div". The "remove-siblings" option keeps the element in its original DOM position but deletes other elements, preserving descendant selectors. The "hide-siblings" option keeps all elements but hides non-selected ones with display:none, preserving all CSS context.',
      required: false,
      options: {
        options: [
          { label: 'cut-out', value: 'cut-out' },
          { label: 'remove-siblings', value: 'remove-siblings' },
          { label: 'hide-siblings', value: 'hide-siblings' },
        ],
      },
      defaultValue: 'cut-out',
    }),
    wait_for_element: Property.ShortText({
      displayName: 'Wait For Element',
      description: 'Wait for the specified element in a source document. Use this when specific dynamic content must be ready before conversion, avoiding unnecessary delays from a fixed JavaScript delay. The element is specified by one or more CSS selectors. The element is searched for in the main document and all iframes. If the element is not found, the conversion fails. Your license defines the maximum wait time by the "Max Delay" parameter.',
      required: false,
    }),
    auto_detect_element_to_convert: Property.Checkbox({
      displayName: 'Auto Detect Element To Convert',
      description: 'The main HTML element for conversion is detected automatically. Use this when you want to extract article or main content without knowing the exact CSS selector, automatically excluding navigation and sidebars.',
      required: false,
    }),
    readability_enhancements: Property.StaticDropdown({
      displayName: 'Readability Enhancements',
      description: 'Automatically enhance the input HTML to improve readability by removing clutter and reformatting content. Use this when converting web pages with excessive navigation, ads, or sidebars that distract from the main content. Different versions (v1-v4) use progressively aggressive algorithms - start with "v1" and increase if more cleanup is needed. Ideal for converting blog posts, articles, or documentation into clean PDFs.',
      required: false,
      options: {
        options: [
          { label: 'none', value: 'none' },
          { label: 'readability-v1', value: 'readability-v1' },
          { label: 'readability-v2', value: 'readability-v2' },
          { label: 'readability-v3', value: 'readability-v3' },
          { label: 'readability-v4', value: 'readability-v4' },
        ],
      },
      defaultValue: 'none',
    }),
    scale_factor: Property.Number({
      displayName: 'Scale Factor',
      description: 'Set the scaling factor (zoom) for the main page area to fit content better. Use values below 100% to shrink oversized content that is getting cut off at page edges. Use values above 100% to enlarge small content for better readability. Common use cases include shrinking wide tables to fit (70-80%), or enlarging mobile-optimized layouts for desktop PDFs (120-150%).',
      required: false,
      defaultValue: 100,
    }),
    jpeg_quality: Property.Number({
      displayName: 'JPEG Quality',
      description: 'Set the quality of embedded JPEG images to balance file size and visual quality. Use 100% for archival documents or when image quality is critical. Use 70-85% for web distribution to significantly reduce file size with minimal visible quality loss. Use lower values (50-60%) only when file size is more important than image clarity. Common artifacts below 60% include blockiness and color banding.',
      required: false,
      defaultValue: 100,
    }),
    convert_images_to_jpeg: Property.StaticDropdown({
      displayName: 'Convert Images To JPEG',
      description: 'Specify which image types will be converted to JPEG to reduce PDF file size. Use "opaque" to convert only non-transparent images (safe for most documents). Use "all" to convert everything including transparent images (transparent areas become white). Use "none" to preserve original image formats. Ideal for reducing file size when distributing large image-heavy PDFs via email or web.',
      required: false,
      options: {
        options: [
          { label: 'none', value: 'none' },
          { label: 'opaque', value: 'opaque' },
          { label: 'all', value: 'all' },
        ],
      },
      defaultValue: 'none',
    }),
    image_dpi: Property.Number({
      displayName: 'Image DPI',
      description: 'Set the DPI of images in PDF to control resolution and file size. Use 300 DPI for professional printing, 150 DPI for everyday documents, 96 DPI for screen-only viewing, or 72 DPI for web distribution. Lower DPI creates smaller files but reduces image quality. Use 0 to preserve original image resolution. Note that this only downscales - it will not upscale low-resolution images.',
      required: false,
    }),
    enable_pdf_forms: Property.Checkbox({
      displayName: 'Enable PDF Forms',
      description: 'Convert HTML forms to fillable PDF forms that users can complete in PDF readers. Use this to create interactive PDFs from HTML forms. Ideal for creating fillable applications, surveys, or order forms that work offline. Details can be found in the blog post.',
      required: false,
    }),
    linearize: Property.Checkbox({
      displayName: 'Linearize',
      description: 'Create linearized PDF. This is also known as Fast Web View. Use this to optimize PDFs for progressive download, allowing users to start viewing the first page while the rest downloads.',
      required: false,
    }),
    encrypt: Property.Checkbox({
      displayName: 'Encrypt',
      description: 'Encrypt the PDF to prevent search engines from indexing the contents and add an extra layer of security. Use this for confidential documents, internal reports, or any content you do not want appearing in search results. Combine with a password to require authentication for viewing, or just use encryption alone to prevent indexing while keeping the PDF publicly readable.',
      required: false,
    }),
    user_password: Property.ShortText({
      displayName: 'User Password',
      description: 'Protect the PDF with a user password to restrict who can open and view the document. Recipients must enter this password to view the PDF. Use this for confidential documents, sensitive data, or content distribution where you want to control access. Combine with permission flags to restrict what users can do after opening.',
      required: false,
    }),
    owner_password: Property.ShortText({
      displayName: 'Owner Password',
      description: 'Protect the PDF with an owner password for administrative control. This password allows changing permissions, passwords, and document restrictions - like a master key. Use different user and owner passwords to give recipients restricted access while retaining full control. The owner password should be kept confidential and different from the user password.',
      required: false,
    }),
    no_print: Property.Checkbox({
      displayName: 'No Print',
      description: 'Disallow printing of the output PDF to protect sensitive content. Use this for confidential documents, copyrighted materials, or preview versions you want to restrict.',
      required: false,
    }),
    no_modify: Property.Checkbox({
      displayName: 'No Modify',
      description: 'Disallow modification of the output PDF to maintain document integrity. Use this for official documents, contracts, or records that should not be altered after creation. Prevents recipients from editing content, adding annotations, or extracting pages.',
      required: false,
    }),
    no_copy: Property.Checkbox({
      displayName: 'No Copy',
      description: 'Disallow text and graphics extraction from the output PDF to protect copyrighted content. Use this for ebooks, proprietary documents, or materials where you want to prevent easy copying and redistribution.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Set the title of the PDF that appears in PDF reader title bars and document properties. Use descriptive titles for better organization and searchability in document management systems. This metadata helps users identify documents when multiple PDFs are open and improves accessibility for screen readers.',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Set the subject of the PDF to categorize or summarize the document content. Use this to add searchable metadata for document management systems, improve organization in large PDF libraries, or provide context about the document\'s purpose. Appears in PDF properties dialog.',
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'Set the author of the PDF for attribution and document tracking. Use this to identify who created the document, important for official documents, reports, or publications. This metadata appears in PDF properties and helps with document management and version control.',
      required: false,
    }),
    keywords: Property.ShortText({
      displayName: 'Keywords',
      description: 'Associate keywords with the document to improve searchability in document management systems. Use relevant terms that describe the content, making it easier to find documents later. Separate multiple keywords with commas. Particularly useful for large document repositories or DAM systems.',
      required: false,
    }),
    extract_meta_tags: Property.Checkbox({
      displayName: 'Extract Meta Tags',
      description: 'Extract meta tags (author, keywords and description) from the input HTML and automatically populate PDF metadata. Use this when converting web pages that already have proper HTML meta tags, saving you from manually setting title, author, and keywords. Ideal for automated conversion workflows where source HTML is well-structured.',
      required: false,
    }),
    page_layout: Property.StaticDropdown({
      displayName: 'Page Layout',
      description: 'Control how pages appear when the PDF opens in viewers that respect these preferences. "single-page" for focused reading one page at a time. "one-column" for continuous scrolling like a web page. "two-column-left" for book-like layouts with odd pages on left (international standard). "two-column-right" for magazines with odd pages on right.',
      required: false,
      options: {
        options: [
          { label: 'single-page', value: 'single-page' },
          { label: 'one-column', value: 'one-column' },
          { label: 'two-column-left', value: 'two-column-left' },
          { label: 'two-column-right', value: 'two-column-right' },
        ],
      },
    }),
    page_mode: Property.StaticDropdown({
      displayName: 'Page Mode',
      description: 'Control the initial display mode when the PDF opens. "full-screen" for presentations and kiosk displays where you want an immersive experience. "thumbnails" for long documents where visual page navigation is helpful. "outlines" for structured documents with bookmarks/table of contents.',
      required: false,
      options: {
        options: [
          { label: 'full-screen', value: 'full-screen' },
          { label: 'thumbnails', value: 'thumbnails' },
          { label: 'outlines', value: 'outlines' },
        ],
      },
    }),
    initial_zoom_type: Property.StaticDropdown({
      displayName: 'Initial Zoom Type',
      description: 'Control how the PDF is initially zoomed when opened.',
      required: false,
      options: {
        options: [
          { label: 'fit-width', value: 'fit-width' },
          { label: 'fit-height', value: 'fit-height' },
          { label: 'fit-page', value: 'fit-page' },
        ],
      },
    }),
    initial_page: Property.Number({
      displayName: 'Initial Page',
      description: 'Display the specified page when the document is opened.',
      required: false,
    }),
    initial_zoom: Property.Number({
      displayName: 'Initial Zoom',
      description: 'Specify the initial page zoom in percents when the document is opened.',
      required: false,
    }),
    hide_toolbar: Property.Checkbox({
      displayName: 'Hide Toolbar',
      description: 'Hide the viewer\'s toolbar when the PDF is opened to provide a cleaner, more focused reading experience. Use this for presentations, kiosk displays, or immersive reading where you want minimal UI distractions.',
      required: false,
    }),
    hide_menubar: Property.Checkbox({
      displayName: 'Hide Menubar',
      description: 'Hide the viewer\'s menu bar when the PDF is opened for a cleaner interface. Use this for kiosk mode, presentations, or embedded PDFs where you want to minimize UI elements.',
      required: false,
    }),
    hide_window_ui: Property.Checkbox({
      displayName: 'Hide Window UI',
      description: 'Hide user interface elements like scroll bars and navigation controls when the PDF opens. Use this for presentation mode, digital signage, or embedded PDFs where you want the most minimal interface possible. Combines with other UI hiding options for full-screen immersive viewing.',
      required: false,
    }),
    fit_window: Property.Checkbox({
      displayName: 'Fit Window',
      description: 'Resize the PDF viewer window to fit the size of the first displayed page when opened. Use this to ensure the PDF opens at an appropriate size rather than filling the entire screen. Particularly useful for small documents, forms, or certificates that look better at actual size.',
      required: false,
    }),
    center_window: Property.Checkbox({
      displayName: 'Center Window',
      description: 'Position the PDF viewer window in the center of the screen when opened. Use this with window resizing to create a professional, centered display for forms, certificates, or small documents. Improves the initial viewing experience by avoiding corner-positioned windows.',
      required: false,
    }),
    display_title: Property.Checkbox({
      displayName: 'Display Title',
      description: 'Display the title of the HTML document in the PDF viewer\'s title bar instead of the filename. Use this to show more descriptive titles when PDFs are opened - particularly useful when the filename is cryptic or auto-generated. Improves user experience by showing meaningful document names.',
      required: false,
    }),
    right_to_left: Property.Checkbox({
      displayName: 'Right To Left',
      description: 'Set the predominant reading order for text to right-to-left. This option has no direct effect on the document\'s contents or page numbering but can be used to determine the relative positioning of pages when displayed side by side or printed n-up.',
      required: false,
    }),
    debug_log: Property.Checkbox({
      displayName: 'Debug Log',
      description: 'Turn on debug logging to troubleshoot conversion issues. Details about the conversion process, including resource loading, rendering steps, and error messages are stored in the debug log. Use this when conversions fail or produce unexpected results.',
      required: false,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Tag the conversion with a custom value for tracking and analytics. Use this to categorize conversions by customer ID, document type, or business unit. The tag appears in conversion statistics. A value longer than 32 characters is cut off.',
      required: false,
    }),
    http_proxy: Property.ShortText({
      displayName: 'HTTP Proxy',
      description: 'A proxy server used by the conversion process for accessing the source URLs with HTTP scheme. This can help circumvent regional restrictions or provide limited access to your intranet.',
      required: false,
    }),
    https_proxy: Property.ShortText({
      displayName: 'HTTPS Proxy',
      description: 'A proxy server used by the conversion process for accessing the source URLs with HTTPS scheme. This can help circumvent regional restrictions or provide limited access to your intranet.',
      required: false,
    }),
    layout_dpi: Property.Number({
      displayName: 'Layout DPI',
      description: 'Set the internal DPI resolution used for positioning of PDF contents. It can help in situations where there are small inaccuracies in the PDF. It is recommended to use values that are a multiple of 72, such as 288 or 360.',
      required: false,
      defaultValue: 300,
    }),
    main_document_css_annotation: Property.Checkbox({
      displayName: 'Main Document CSS Annotation',
      description: 'Add special CSS classes to the main document\'s body element. This allows applying custom styling based on these classes: pdfcrowd-page-X - where X is the current page number pdfcrowd-page-odd - odd page pdfcrowd-page-even - even page',
      required: false,
    }),
    header_footer_css_annotation: Property.Checkbox({
      displayName: 'Header Footer CSS Annotation',
      description: 'Add special CSS classes to the header/footer\'s body element. This allows applying custom styling based on these classes: pdfcrowd-page-X - where X is the current page number pdfcrowd-page-count-X - where X is the total page count pdfcrowd-page-first - the first page pdfcrowd-page-last - the last page pdfcrowd-page-odd - odd page pdfcrowd-page-even - even page',
      required: false,
    }),
    conversion_config: Property.LongText({
      displayName: 'Conversion Config',
      description: 'Configure conversion via JSON. The configuration defines various page settings for individual PDF pages or ranges of pages. It provides flexibility in designing each page of the PDF, giving control over each page\'s size, header, footer, etc. If a page or parameter is not explicitly specified, the system will use the default settings for that page or attribute. If a JSON configuration is provided, the settings in the JSON will take precedence over the global options. The structure of the JSON must be: pageSetup: An array of objects where each object defines the configuration for a specific page or range of pages. The following properties can be set for each page object: pages: A comma-separated list of page numbers or ranges. Special strings may be used, such as odd, even, and last. For example: 1-: from page 1 to the end of the document 2: only the 2nd page 2,4,6: pages 2, 4, and 6 2-5: pages 2 through 5 odd,2: the 2nd page and all odd pages pageSize: The page size (optional). Possible values: A0, A1, A2, A3, A4, A5, A6, Letter. pageWidth: The width of the page (optional). pageHeight: The height of the page (optional). marginLeft: Left margin (optional). marginRight: Right margin (optional). marginTop: Top margin (optional). marginBottom: Bottom margin (optional). displayHeader: Header appearance (optional). Possible values: none: completely excluded space: only the content is excluded, the space is used content: the content is printed (default) displayFooter: Footer appearance (optional). Possible values: none: completely excluded space: only the content is excluded, the space is used content: the content is printed (default) headerHeight: Height of the header (optional). footerHeight: Height of the footer (optional). orientation: Page orientation, such as "portrait" or "landscape" (optional). backgroundColor: Page background color in RRGGBB or RRGGBBAA hexadecimal format (optional). Dimensions may be empty, 0 or specified in inches "in", millimeters "mm", centimeters "cm", pixels "px", or points "pt".',
      required: false,
    }),
    converter_version: Property.StaticDropdown({
      displayName: 'Converter Version',
      description: 'Set the converter version. Different versions may produce different output. Choose which one provides the best output for your case.',
      required: false,
      options: {
        options: [
          { label: '24.04', value: '24.04' },
          { label: '20.10', value: '20.10' },
          { label: '18.10', value: '18.10' },
        ],
      },
      defaultValue: '24.04',
    }),
    page_watermark: Property.File({
      displayName: 'Page Watermark',
      description: 'Apply the first page of a watermark PDF to every page of the output PDF. Use this to add transparent overlays like "DRAFT" stamps, security markings, or branding elements that appear on top of content. Ideal for confidential document marking or adding protective overlays.',
      required: false,
    }),
    multipage_watermark: Property.File({
      displayName: 'Multipage Watermark',
      description: 'Apply each page of a watermark PDF to the corresponding page of the output PDF. Use this for page-specific watermarks where different pages need different overlays - for example, different approval stamps per department. If the watermark has fewer pages than the output, the last watermark page is repeated for remaining pages.',
      required: false,
    }),
    page_background: Property.File({
      displayName: 'Page Background',
      description: 'Apply the first page of a background PDF to every page of the output PDF. Use this to add letterheads, branded templates, or decorative backgrounds that appear behind your content. Backgrounds appear beneath content, while watermarks layer on top. Perfect for adding company letterheads to reports or applying branded templates to dynamically generated content.',
      required: false,
    }),
    multipage_background: Property.File({
      displayName: 'Multipage Background',
      description: 'Apply each page of a background PDF to the corresponding page of the output PDF. Use this for page-specific backgrounds where each page needs a different template - for example, different letterheads for front and back pages. If the background has fewer pages than the output, the last background page is repeated for remaining pages.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Build multipart form data to support file uploads
    const formData = new FormData();
    formData.append('text', propsValue.htmlContent);

    // Add basic options
    const basicOptions = [
      'page_size',
      'page_width',
      'page_height',
      'orientation',
      'margin_top',
      'margin_right',
      'margin_bottom',
      'margin_left',
      'no_margins',
      'print_page_range',
      'content_viewport_width',
      'content_viewport_height',
      'content_fit_mode',
      'remove_blank_pages',
      'header_url',
      'header_html',
      'header_height',
      'footer_url',
      'footer_html',
      'footer_height',
      'no_header_footer_horizontal_margins',
      'exclude_header_on_pages',
      'exclude_footer_on_pages',
      'header_footer_scale_factor',
      'page_numbering_offset',
      'page_watermark_url',
      'multipage_watermark_url',
      'page_background_url',
      'multipage_background_url',
      'page_background_color',
      'use_print_media',
      'no_background',
      'disable_javascript',
      'disable_image_loading',
      'disable_remote_fonts',
      'load_iframes',
      'block_ads',
      'default_encoding',
      'locale',
      'http_auth_user_name',
      'http_auth_password',
      'cookies',
      'verify_ssl_certificates',
      'fail_on_main_url_error',
      'fail_on_any_url_error',
      'css_page_rule_mode',
      'custom_css',
      'custom_javascript',
      'on_load_javascript',
      'custom_http_header',
      'javascript_delay',
      'element_to_convert',
      'element_to_convert_mode',
      'wait_for_element',
      'auto_detect_element_to_convert',
      'readability_enhancements',
      'scale_factor',
      'jpeg_quality',
      'convert_images_to_jpeg',
      'image_dpi',
      'enable_pdf_forms',
      'linearize',
      'encrypt',
      'user_password',
      'owner_password',
      'no_print',
      'no_modify',
      'no_copy',
      'title',
      'subject',
      'author',
      'keywords',
      'extract_meta_tags',
      'page_layout',
      'page_mode',
      'initial_zoom_type',
      'initial_page',
      'initial_zoom',
      'hide_toolbar',
      'hide_menubar',
      'hide_window_ui',
      'fit_window',
      'center_window',
      'display_title',
      'right_to_left',
      'debug_log',
      'tag',
      'http_proxy',
      'https_proxy',
      'layout_dpi',
      'main_document_css_annotation',
      'header_footer_css_annotation',
      'conversion_config',
    ];

    for (const opt of basicOptions) {
      const value = propsValue[opt as keyof typeof propsValue];
      if (value !== undefined && value !== null && value !== '') {
        formData.append(opt, String(value));
      }
    }

    // Add file options (watermarks, backgrounds)
    const fileOptions = [
      'page_watermark',
      'multipage_watermark',
      'page_background',
      'multipage_background',
    ];

    for (const opt of fileOptions) {
      const fileValue = propsValue[opt as keyof typeof propsValue] as { data: Buffer; filename: string } | undefined;
      if (fileValue?.data) {
        formData.append(opt, fileValue.data, { filename: fileValue.filename || `${opt}.pdf` });
      }
    }

    // Using direct REST API for tight integration with Activepieces framework
    const formBuffer = formData.getBuffer();
    const converterVersion = propsValue.converter_version || '24.04';
    const response = await fetch(getConvertUrl(converterVersion), {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(auth),
        'User-Agent': 'pdfcrowd-activepieces/0.0.5',
        ...formData.getHeaders(),
      },
      body: formBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Conversion failed (${response.status}): ${errorText}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    const filename = propsValue.outputFilename || 'document.pdf';

    // Save the PDF file
    const file = await context.files.write({
      fileName: filename,
      data: Buffer.from(pdfBuffer),
    });

    return {
      file,
      filename,
      jobId: response.headers.get('x-pdfcrowd-job-id') || '',
      pageCount: parseInt(response.headers.get('x-pdfcrowd-pages') || '0', 10),
      outputSize: parseInt(response.headers.get('x-pdfcrowd-output-size') || '0', 10),
      consumedCredits: parseInt(response.headers.get('x-pdfcrowd-consumed-credits') || '0', 10),
      remainingCredits: parseInt(response.headers.get('x-pdfcrowd-remaining-credits') || '0', 10),
    };
  },
});
