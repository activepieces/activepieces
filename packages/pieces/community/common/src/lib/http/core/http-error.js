"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
class HttpError extends Error {
    constructor(requestBody, err) {
        var _a, _b;
        const status = ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status) || 500;
        const responseBody = (_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.data;
        super(JSON.stringify({
            response: {
                status: status,
                body: responseBody,
            },
            request: {
                body: requestBody,
            },
        }));
        this.requestBody = requestBody;
        this.status = status;
        this.responseBody = responseBody;
    }
    errorMessage() {
        return {
            response: {
                status: this.status,
                body: this.responseBody,
            },
            request: {
                body: this.requestBody,
            },
        };
    }
    get response() {
        return {
            status: this.status,
            body: this.responseBody,
        };
    }
    get request() {
        return {
            body: this.requestBody,
        };
    }
}
exports.HttpError = HttpError;
//# sourceMappingURL=http-error.js.map