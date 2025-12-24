"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USE_DRAFT_QUERY_PARAM_NAME = exports.ChatUIResponse = exports.ChatUIProps = exports.FormResponse = exports.FormProps = exports.FormInput = exports.FormInputType = void 0;
const typebox_1 = require("@sinclair/typebox");
var FormInputType;
(function (FormInputType) {
    FormInputType["TEXT"] = "text";
    FormInputType["FILE"] = "file";
    FormInputType["TEXT_AREA"] = "text_area";
    FormInputType["TOGGLE"] = "toggle";
})(FormInputType || (exports.FormInputType = FormInputType = {}));
exports.FormInput = typebox_1.Type.Object({
    displayName: typebox_1.Type.String(),
    required: typebox_1.Type.Boolean(),
    description: typebox_1.Type.String(),
    type: typebox_1.Type.Enum(FormInputType),
});
exports.FormProps = typebox_1.Type.Object({
    inputs: typebox_1.Type.Array(exports.FormInput),
    waitForResponse: typebox_1.Type.Boolean(),
});
exports.FormResponse = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    title: typebox_1.Type.String(),
    props: exports.FormProps,
    projectId: typebox_1.Type.String(),
    version: typebox_1.Type.String(),
});
exports.ChatUIProps = typebox_1.Type.Object({
    botName: typebox_1.Type.String(),
});
exports.ChatUIResponse = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    title: typebox_1.Type.String(),
    props: exports.ChatUIProps,
    projectId: typebox_1.Type.String(),
    platformLogoUrl: typebox_1.Type.String(),
    platformName: typebox_1.Type.String(),
});
exports.USE_DRAFT_QUERY_PARAM_NAME = 'useDraft';
//# sourceMappingURL=form.js.map