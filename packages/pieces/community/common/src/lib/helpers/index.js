"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccessTokenOrThrow = void 0;
exports.createCustomApiCallAction = createCustomApiCallAction;
exports.is_chromium_installed = is_chromium_installed;
const tslib_1 = require("tslib");
const pieces_framework_1 = require("@activepieces/pieces-framework");
const http_1 = require("../http");
const shared_1 = require("@activepieces/shared");
const fs_1 = tslib_1.__importDefault(require("fs"));
const mime_types_1 = tslib_1.__importDefault(require("mime-types"));
const getAccessTokenOrThrow = (auth) => {
    const accessToken = auth === null || auth === void 0 ? void 0 : auth.access_token;
    if (accessToken === undefined) {
        throw new Error('Invalid bearer token');
    }
    return accessToken;
};
exports.getAccessTokenOrThrow = getAccessTokenOrThrow;
const joinBaseUrlWithRelativePath = ({ baseUrl, relativePath, }) => {
    const baseUrlWithSlash = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const relativePathWithoutSlash = relativePath.startsWith('/')
        ? relativePath.slice(1)
        : relativePath;
    return `${baseUrlWithSlash}${relativePathWithoutSlash}`;
};
const getBaseUrlForDescription = (baseUrl, auth) => {
    const exampleBaseUrl = `https://api.example.com`;
    try {
        const baseUrlValue = auth ? baseUrl(auth) : undefined;
        const baseUrlValueWithoutTrailingSlash = (baseUrlValue === null || baseUrlValue === void 0 ? void 0 : baseUrlValue.endsWith('/'))
            ? baseUrlValue.slice(0, -1)
            : baseUrlValue;
        return baseUrlValueWithoutTrailingSlash !== null && baseUrlValueWithoutTrailingSlash !== void 0 ? baseUrlValueWithoutTrailingSlash : exampleBaseUrl;
    }
    catch (error) {
        //If baseUrl fails we stil want to return a valid baseUrl for description
        {
            return exampleBaseUrl;
        }
    }
};
function createCustomApiCallAction({ auth, baseUrl, authMapping, description, displayName, name, props, extraProps, authLocation = 'headers', }) {
    var _a, _b, _c, _d, _e, _f;
    return (0, pieces_framework_1.createAction)({
        name: name ? name : 'custom_api_call',
        displayName: displayName ? displayName : 'Custom API Call',
        description: description
            ? description
            : 'Make a custom API call to a specific endpoint',
        auth,
        requireAuth: auth ? true : false,
        props: Object.assign({ url: pieces_framework_1.Property.DynamicProperties({
                auth,
                displayName: '',
                required: true,
                refreshers: [],
                props: (_a) => tslib_1.__awaiter(this, [_a], void 0, function* ({ auth }) {
                    var _b;
                    return {
                        url: pieces_framework_1.Property.ShortText(Object.assign({ displayName: 'URL', description: `You can either use the full URL or the relative path to the base URL
i.e ${getBaseUrlForDescription(baseUrl, auth)}/resource or /resource`, required: true, defaultValue: auth ? baseUrl(auth) : '' }, ((_b = props === null || props === void 0 ? void 0 : props.url) !== null && _b !== void 0 ? _b : {}))),
                    };
                }),
            }), method: pieces_framework_1.Property.StaticDropdown(Object.assign({ displayName: 'Method', required: true, options: {
                    options: Object.values(http_1.HttpMethod).map((v) => {
                        return {
                            label: v,
                            value: v,
                        };
                    }),
                } }, ((_a = props === null || props === void 0 ? void 0 : props.method) !== null && _a !== void 0 ? _a : {}))), headers: pieces_framework_1.Property.Object(Object.assign({ displayName: 'Headers', description: 'Authorization headers are injected automatically from your connection.', required: true }, ((_b = props === null || props === void 0 ? void 0 : props.headers) !== null && _b !== void 0 ? _b : {}))), queryParams: pieces_framework_1.Property.Object(Object.assign({ displayName: 'Query Parameters', required: true }, ((_c = props === null || props === void 0 ? void 0 : props.queryParams) !== null && _c !== void 0 ? _c : {}))), body: pieces_framework_1.Property.Json(Object.assign({ displayName: 'Body', required: false }, ((_d = props === null || props === void 0 ? void 0 : props.body) !== null && _d !== void 0 ? _d : {}))), response_is_binary: pieces_framework_1.Property.Checkbox({
                displayName: 'Response is Binary ?',
                description: 'Enable for files like PDFs, images, etc..',
                required: false,
                defaultValue: false,
            }), failsafe: pieces_framework_1.Property.Checkbox(Object.assign({ displayName: 'No Error on Failure', required: false }, ((_e = props === null || props === void 0 ? void 0 : props.failsafe) !== null && _e !== void 0 ? _e : {}))), timeout: pieces_framework_1.Property.Number(Object.assign({ displayName: 'Timeout (in seconds)', required: false }, ((_f = props === null || props === void 0 ? void 0 : props.timeout) !== null && _f !== void 0 ? _f : {}))) }, extraProps),
        run: (context) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _a;
            const { method, url, headers, queryParams, body, failsafe, timeout, response_is_binary, } = context.propsValue;
            (0, shared_1.assertNotNullOrUndefined)(method, 'Method');
            (0, shared_1.assertNotNullOrUndefined)(url, 'URL');
            const authValue = !(0, shared_1.isNil)(authMapping)
                ? yield authMapping(context.auth, context.propsValue)
                : {};
            const urlValue = url['url'];
            const fullUrl = urlValue.startsWith('http://') || urlValue.startsWith('https://')
                ? urlValue
                : joinBaseUrlWithRelativePath({
                    baseUrl: baseUrl(context.auth),
                    relativePath: urlValue,
                });
            const request = {
                method,
                url: fullUrl,
                headers: Object.assign(Object.assign({}, (headers !== null && headers !== void 0 ? headers : {})), (authLocation === 'headers' || !(0, shared_1.isNil)(authLocation)
                    ? authValue
                    : {})),
                queryParams: Object.assign(Object.assign({}, (authLocation === 'queryParams' ? authValue : {})), ((_a = queryParams) !== null && _a !== void 0 ? _a : {})),
                timeout: timeout ? timeout * 1000 : 0,
            };
            // Set response type to arraybuffer if binary response is expected
            if (response_is_binary) {
                request.responseType = 'arraybuffer';
            }
            if (body) {
                request.body = body;
            }
            try {
                const response = yield http_1.httpClient.sendRequest(request);
                return yield handleBinaryResponse(context.files, response.body, response.status, response.headers, response_is_binary);
            }
            catch (error) {
                if (failsafe) {
                    return error.errorMessage();
                }
                throw error;
            }
        }),
    });
}
function is_chromium_installed() {
    const chromiumPath = '/usr/bin/chromium';
    return fs_1.default.existsSync(chromiumPath);
}
const handleBinaryResponse = (files, bodyContent, status, headers, isBinary) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    let body;
    if (isBinary && isBinaryBody(bodyContent)) {
        const contentTypeValue = Array.isArray(headers === null || headers === void 0 ? void 0 : headers['content-type'])
            ? headers['content-type'][0]
            : headers === null || headers === void 0 ? void 0 : headers['content-type'];
        const fileExtension = mime_types_1.default.extension(contentTypeValue !== null && contentTypeValue !== void 0 ? contentTypeValue : '') || 'txt';
        body = yield files.write({
            fileName: `output.${fileExtension}`,
            data: Buffer.from(bodyContent),
        });
    }
    else {
        body = bodyContent;
    }
    return { status, headers, body };
});
const isBinaryBody = (body) => {
    return body instanceof ArrayBuffer || Buffer.isBuffer(body);
};
//# sourceMappingURL=index.js.map