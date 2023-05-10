import { Static, Type } from "@sinclair/typebox";

export const MultipartFile = Type.Object({
    data: Type.Any(),
    mimetype: Type.String(),
    filename: Type.String(),
});

export type MultipartFile = Static<typeof MultipartFile>;