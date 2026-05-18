
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PieceProperty } from '@activepieces/pieces-framework'

export type ProcessorFn<INPUT = any, OUTPUT = any> = (
    property: PieceProperty,
    value: INPUT,
) => OUTPUT
