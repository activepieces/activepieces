import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export type RichTextProperty<R extends boolean> = BasePropertySchema & {
    /**
     * Name of a sibling property whose value selects the editing mode.
     * The sibling value is mapped by convention: 'plain_text' | 'plain' | 'text' -> plain,
     * 'html' -> rich/html, 'markdown' | 'md' -> markdown. Anything else falls back to plain.
     */
    formatProperty?: string;
} & TPropertyValue<string, PropertyType.RICH_TEXT, R>;
