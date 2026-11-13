import { tryCatch } from '@activepieces/pieces-framework';

import {
  PDFBool,
  PDFButton,
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFDict,
  PDFField,
  PDFFont,
  PDFForm,
  PDFHexString,
  PDFName,
  PDFOptionList,
  PDFRadioGroup,
  PDFRef,
  PDFSignature,
  PDFString,
  PDFTextField,
  PDFWidgetAnnotation,
  TextAlignment,
  layoutMultilineText,
} from 'pdf-lib';
import { xfaTemplate } from './xfa-template';

export const pdfForm = {
  open,
  fill,
  isFillable,
  isEmpty,
  shortLabel,
  unfillableMessage,
};

async function open(data: Buffer): Promise<PdfForm> {
  const { data: form, error } = await tryCatch(async () => analyze(data));
  if (error) {
    if (data.includes(XFA_MARKER)) {
      return { kind: 'xfa', pageCount: null, fields: [], document: null };
    }
    throw new Error(
      'This file could not be read as a PDF. Check that it is a PDF file and that it is not damaged.'
    );
  }
  return form;
}

async function analyze(data: Buffer): Promise<PdfForm> {
  const document = await PDFDocument.load(new Uint8Array(data), {
    ignoreEncryption: true,
  });
  const pageCount = document.getPageCount();
  if (document.isEncrypted) {
    return { kind: 'encrypted', pageCount, fields: [], document: null };
  }
  const xfa = findXfa(document);
  if (xfa.needsRendering) {
    return { kind: 'xfa', pageCount, fields: [], document: null };
  }
  const fields = readFields({
    document,
    templateLabels: xfa.present
      ? await xfaTemplate.readLabels(document)
      : new Map(),
  });
  if (xfa.present && !fields.some(isFillable)) {
    return { kind: 'xfa', pageCount, fields: [], document: null };
  }
  if (fields.length === 0) {
    return { kind: 'flat', pageCount, fields: [], document: null };
  }
  return { kind: 'acroform', pageCount, fields, document };
}

async function fill({
  data,
  values,
  flatten,
}: {
  data: Buffer;
  values: Record<string, unknown>;
  flatten: boolean;
}): Promise<Buffer> {
  const opened = await open(data);
  if (opened.kind !== 'acroform') {
    throw new Error(UNFILLABLE_KIND_MESSAGES[opened.kind]);
  }
  const form = opened.document.getForm();
  const entries = Object.entries(values).filter(([, value]) => !isEmpty(value));
  const font = form.getDefaultFont();
  const pen = { font, drawableCharacters: new Set(font.getCharacterSet()) };
  const models = new Map(opened.fields.map((field) => [field.name, field]));
  const problems = entries.flatMap(([name, value]) => {
    const model = models.get(name);
    const problem = findProblem({
      model,
      field: form.getFieldMaybe(name),
      value,
      pen,
    });
    const label =
      model?.label && model.label !== name
        ? ` (${shortLabel({ label: model.label, maxLength: model.maxLength })})`
        : '';
    return problem ? [`- "${name}"${label}: ${problem}`] : [];
  });
  if (problems.length > 0) {
    throw new Error(
      [
        `The PDF form was not filled. Fix ${
          problems.length === 1
            ? 'this field'
            : `these ${problems.length} fields`
        } and try again:`,
        ...problems,
      ].join('\n')
    );
  }
  entries.forEach(([name, value]) =>
    setValue({ field: form.getField(name), value, font })
  );
  if (flatten) {
    form.flatten();
    removeMissingAnnotations(opened.document);
  } else {
    keepLabels({ form, fields: opened.fields });
  }
  return Buffer.from(await opened.document.save());
}

function keepLabels({
  form,
  fields,
}: {
  form: PDFForm;
  fields: PdfFormField[];
}): void {
  fields.forEach((model) => {
    const field = form.getFieldMaybe(model.name);
    if (model.label !== null && field && readLabel(field) === null) {
      field.acroField.dict.set(
        PDFName.of('TU'),
        PDFHexString.fromText(model.label)
      );
    }
  });
}

function removeMissingAnnotations(document: PDFDocument): void {
  document.getPages().forEach((page) => {
    const annotations = page.node.Annots();
    if (annotations === undefined) {
      return;
    }
    for (let index = annotations.size() - 1; index >= 0; index--) {
      const annotation = annotations.get(index);
      if (
        annotation instanceof PDFRef &&
        document.context.lookup(annotation) === undefined
      ) {
        annotations.remove(index);
      }
    }
  });
}

function findProblem({
  model,
  field,
  value,
  pen,
}: {
  model: PdfFormField | undefined;
  field: PDFField | undefined;
  value: unknown;
  pen: Pen;
}): string | undefined {
  if (!model || !field) {
    return 'this PDF has no field with this name. Run Inspect PDF Form to see the field names.';
  }
  if (model.type === 'button' || model.type === 'signature') {
    return `a ${model.type} field cannot be filled.`;
  }
  if (model.readOnly) {
    return 'this field is read-only.';
  }
  if (model.type === 'checkbox') {
    return toBoolean(value) === undefined
      ? 'use true or false for a checkbox.'
      : undefined;
  }
  if (field instanceof PDFTextField) {
    return findTextProblem({ model, field, value, pen });
  }
  return findChoiceProblem({ model, field, value, pen });
}

function findTextProblem({
  model,
  field,
  value,
  pen,
}: {
  model: PdfFormField;
  field: PDFTextField;
  value: unknown;
  pen: Pen;
}): string | undefined {
  if (typeof value === 'object') {
    return 'use text, a number or true/false, not a list or an object.';
  }
  const text = toFieldText({ value, multiline: field.isMultiline() });
  if (model.maxLength !== null && text.length > model.maxLength) {
    return `the value has ${text.length} characters, but this field takes at most ${model.maxLength}.`;
  }
  const undrawable = findUndrawable({ text, pen });
  if (undrawable !== undefined) {
    return `the form's font cannot draw "${undrawable}". ${LATIN_ONLY}`;
  }
  return fitText({ field, text, font: pen.font }).kind === 'too-long'
    ? "the text does not fit in this field's box, even at the smallest font size. Shorten it."
    : undefined;
}

function findChoiceProblem({
  model,
  field,
  value,
  pen,
}: {
  model: PdfFormField;
  field: PDFField;
  value: unknown;
  pen: Pen;
}): string | undefined {
  const choices = toList(value);
  if (choices.length > 1 && model.multiSelect !== true) {
    return 'pick one option, not a list.';
  }
  const options = model.options ?? [];
  const typed = field instanceof PDFDropdown && field.isEditable();
  const outside = choices.find((choice) => !options.includes(choice));
  if (!typed && outside !== undefined) {
    return `"${outside}" is not one of the options (${options.join(', ')}).`;
  }
  if (model.type === 'list') {
    const undrawable = findUndrawable({ text: options.join(''), pen });
    return undrawable === undefined
      ? undefined
      : `the form's font cannot draw "${undrawable}" in this list's options. ${LATIN_ONLY}`;
  }
  if (model.type === 'dropdown') {
    const undrawable = findUndrawable({ text: choices.join(''), pen });
    return undrawable === undefined
      ? undefined
      : `the form's font cannot draw "${undrawable}". ${LATIN_ONLY}`;
  }
  return undefined;
}

function findUndrawable({
  text,
  pen,
}: {
  text: string;
  pen: Pen;
}): string | undefined {
  return [...text].find(
    (char) =>
      !LAYOUT_CHARACTERS.has(char) &&
      !pen.drawableCharacters.has(char.codePointAt(0) ?? 0)
  );
}

function setValue({
  field,
  value,
  font,
}: {
  field: PDFField;
  value: unknown;
  font: PDFFont;
}): void {
  if (field instanceof PDFCheckBox) {
    if (toBoolean(value)) {
      field.check();
    } else {
      field.uncheck();
    }
    return;
  }
  if (field instanceof PDFRadioGroup) {
    field.select(String(value));
    return;
  }
  if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
    field.select(toList(value));
    return;
  }
  if (field instanceof PDFTextField) {
    const text = toFieldText({ value, multiline: field.isMultiline() });
    const fit = fitText({ field, text, font });
    if (fit.kind === 'shrink') {
      setFontSize({ field, fontSize: fit.fontSize });
    }
    field.setText(text);
  }
}

function fitText({
  field,
  text,
  font,
}: {
  field: PDFTextField;
  text: string;
  font: PDFFont;
}): TextFit {
  if (field.isCombed()) {
    return { kind: 'fits' };
  }
  const fieldFontSize =
    readFontSize(field.acroField.getDefaultAppearance()) ?? AUTO_FONT_SIZE;
  const widgets = field.acroField.getWidgets().map((widget) => {
    const fontSize =
      readFontSize(widget.getDefaultAppearance()) ?? fieldFontSize;
    const fitting = largestFittingSize({
      text,
      font,
      box: textBox(widget),
      multiline: field.isMultiline(),
      fontSize,
    });
    return { fontSize, fitting };
  });
  const fittingSizes = widgets.flatMap(({ fitting }) =>
    fitting === undefined ? [] : [fitting]
  );
  if (fittingSizes.length < widgets.length) {
    return { kind: 'too-long' };
  }
  const mustShrink = widgets.some(
    ({ fontSize, fitting }) => fitting !== undefined && fitting < fontSize
  );
  return mustShrink
    ? { kind: 'shrink', fontSize: Math.min(...fittingSizes) }
    : { kind: 'fits' };
}

function largestFittingSize({
  text,
  font,
  box,
  multiline,
  fontSize,
}: {
  text: string;
  font: PDFFont;
  box: TextBox;
  multiline: boolean;
  fontSize: number;
}): number | undefined {
  const fits = (size: number) =>
    isInside({ text, font, box, multiline, fontSize: size });
  if (fontSize === AUTO_FONT_SIZE) {
    return fits(MIN_FONT_SIZE) ? AUTO_FONT_SIZE : undefined;
  }
  if (fontSize <= MAX_FONT_SIZE && fits(fontSize)) {
    return fontSize;
  }
  const largestCandidate = Math.min(Math.ceil(fontSize) - 1, MAX_FONT_SIZE);
  for (let size = largestCandidate; size >= MIN_FONT_SIZE; size--) {
    if (fits(size)) {
      return size;
    }
  }
  return undefined;
}

function isInside({
  text,
  font,
  box,
  multiline,
  fontSize,
}: {
  text: string;
  font: PDFFont;
  box: TextBox;
  multiline: boolean;
  fontSize: number;
}): boolean {
  if (!multiline) {
    return (
      font.widthOfTextAtSize(text, fontSize) <= box.width &&
      font.heightAtSize(fontSize) <= box.height
    );
  }
  const layout = layoutMultilineText(text, {
    alignment: TextAlignment.Left,
    fontSize,
    font,
    bounds: box,
  });
  return (
    layout.lines.length * layout.lineHeight <= box.height &&
    layout.lines.every((line) => line.width <= box.width)
  );
}

function textBox(widget: PDFWidgetAnnotation): TextBox {
  const inset = (widget.getBorderStyle()?.getWidth() ?? 0) + 1;
  const rectangle = widget.getRectangle();
  const width = Math.abs(rectangle.width);
  const height = Math.abs(rectangle.height);
  const rotation = widget.getAppearanceCharacteristics()?.getRotation() ?? 0;
  const turned = Math.abs(rotation) % 180 === 90;
  return {
    x: 0,
    y: 0,
    width: (turned ? height : width) - inset * 2,
    height: (turned ? width : height) - inset * 2,
  };
}

function setFontSize({
  field,
  fontSize,
}: {
  field: PDFTextField;
  fontSize: number;
}): void {
  field.setFontSize(fontSize);
  field.acroField.getWidgets().forEach((widget) => {
    const appearance = widget.getDefaultAppearance();
    if (appearance && readFontSize(appearance) !== undefined) {
      widget.setDefaultAppearance(
        appearance.replace(FONT_SIZE_PATTERN, `${fontSize}$2`)
      );
    }
  });
}

function readFontSize(appearance: string | undefined): number | undefined {
  const match = appearance ? FONT_SIZE_PATTERN.exec(appearance) : null;
  return match ? Number(match[1]) : undefined;
}

function toFieldText({
  value,
  multiline,
}: {
  value: unknown;
  multiline: boolean;
}): string {
  const text = String(value);
  return multiline ? text : text.replace(/[\t\r\n]+/g, ' ');
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  return undefined;
}

function toList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function readFields({
  document,
  templateLabels,
}: {
  document: PDFDocument;
  templateLabels: Map<string, string | null>;
}): PdfFormField[] {
  const pageByWidget = mapWidgetsToPages(document);
  const fields = document.getForm().getFields();
  const templateMatches = fields
    .filter((field) => !UNFILLABLE_TYPES.includes(fieldType(field)))
    .every((field) => templateLabels.has(field.getName()));
  return fields
    .map((field) =>
      readField({
        doc: document,
        field,
        pageByWidget,
        templateLabel: templateMatches
          ? templateLabels.get(field.getName()) ?? null
          : null,
      })
    )
    .sort(
      (first, second) =>
        first.position.page - second.position.page ||
        toRow(second.position.top) - toRow(first.position.top) ||
        first.position.left - second.position.left
    )
    .map(({ position: _position, ...field }) => field);
}

function findXfa(document: PDFDocument): {
  present: boolean;
  needsRendering: boolean;
} {
  const acroForm = document.catalog.lookupMaybe(
    PDFName.of('AcroForm'),
    PDFDict
  );
  const needsRendering = document.catalog.lookup(PDFName.of('NeedsRendering'));
  return {
    present: acroForm?.has(PDFName.of('XFA')) ?? false,
    needsRendering:
      needsRendering instanceof PDFBool && needsRendering.asBoolean(),
  };
}

function readField({
  doc,
  field,
  pageByWidget,
  templateLabel,
}: {
  doc: PDFDocument;
  field: PDFField;
  pageByWidget: Map<string, number>;
  templateLabel: string | null;
}): PositionedField {
  const widget = field.acroField.getWidgets()[0];
  const page = widget ? findPage({ doc, widget, pageByWidget }) : null;
  const rectangle = widget?.getRectangle();
  return {
    name: field.getName(),
    label: readLabel(field) ?? templateLabel,
    type: fieldType(field),
    page: page === null ? null : page + 1,
    required: field.isRequired(),
    readOnly: field.isReadOnly(),
    maxLength:
      field instanceof PDFTextField ? field.getMaxLength() ?? null : null,
    multiline: field instanceof PDFTextField ? field.isMultiline() : null,
    multiSelect:
      field instanceof PDFDropdown || field instanceof PDFOptionList
        ? field.isMultiselect()
        : null,
    options: fieldOptions(field),
    value: readValue(field),
    position: {
      page: page ?? Number.MAX_SAFE_INTEGER,
      top: rectangle ? rectangle.y + rectangle.height : 0,
      left: rectangle?.x ?? 0,
    },
  };
}

function fieldType(field: PDFField): PdfFormFieldType {
  if (field instanceof PDFCheckBox) {
    return 'checkbox';
  }
  if (field instanceof PDFRadioGroup) {
    return 'radio';
  }
  if (field instanceof PDFDropdown) {
    return 'dropdown';
  }
  if (field instanceof PDFOptionList) {
    return 'list';
  }
  if (field instanceof PDFButton) {
    return 'button';
  }
  if (field instanceof PDFSignature) {
    return 'signature';
  }
  return 'text';
}

function fieldOptions(field: PDFField): string[] | null {
  if (
    field instanceof PDFRadioGroup ||
    field instanceof PDFDropdown ||
    field instanceof PDFOptionList
  ) {
    return field.getOptions();
  }
  return null;
}

function readValue(field: PDFField): PdfFormValue {
  if (field instanceof PDFCheckBox) {
    return field.isChecked();
  }
  if (field instanceof PDFRadioGroup) {
    return field.getSelected() ?? null;
  }
  if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
    const selected = field.getSelected();
    return field.isMultiselect() ? selected : selected[0] ?? null;
  }
  if (field instanceof PDFTextField) {
    return field.acroField.getValue()?.decodeText() || null;
  }
  return null;
}

function readLabel(field: PDFField): string | null {
  const label = field.acroField.dict.lookup(PDFName.of('TU'));
  if (label instanceof PDFString || label instanceof PDFHexString) {
    return label.decodeText().trim() || null;
  }
  return null;
}

function shortLabel({
  label,
  maxLength,
}: {
  label: string;
  maxLength: number | null;
}): string {
  if (label.length <= MAX_LABEL_LENGTH) {
    return label;
  }
  const ending = maxLength === null ? '' : closingSentences(label);
  return ending === ''
    ? `${cutAtWord({ text: label, length: MAX_LABEL_LENGTH - 1 })}…`
    : `${cutAtWord({
        text: label,
        length: MAX_LABEL_LENGTH - ending.length - 2,
      })}… ${ending}`;
}

function closingSentences(label: string): string {
  const sentences = label.trim().split(SENTENCE_BREAK);
  const endings = sentences
    .slice(1)
    .map((_sentence, index) => sentences.slice(index + 1).join(' '));
  return (
    endings.find(
      (ending) => ending.length <= MAX_ENDING_LENGTH && ending.endsWith('.')
    ) ?? ''
  );
}

function cutAtWord({ text, length }: { text: string; length: number }): string {
  return text.slice(0, length).replace(/\s+\S*$/, '');
}

function unfillableMessage(kind: Exclude<PdfFormKind, 'acroform'>): string {
  return UNFILLABLE_KIND_MESSAGES[kind];
}

function isFillable(field: PdfFormField): boolean {
  return !field.readOnly && !UNFILLABLE_TYPES.includes(field.type);
}

function mapWidgetsToPages(doc: PDFDocument): Map<string, number> {
  const pageByWidget = new Map<string, number>();
  doc.getPages().forEach((page, index) => {
    page.node
      .Annots()
      ?.asArray()
      .forEach((annotation) => {
        if (annotation instanceof PDFRef) {
          pageByWidget.set(annotation.toString(), index);
        }
      });
  });
  return pageByWidget;
}

function findPage({
  doc,
  widget,
  pageByWidget,
}: {
  doc: PDFDocument;
  widget: PDFWidgetAnnotation;
  pageByWidget: Map<string, number>;
}): number | null {
  const widgetRef = doc.context.getObjectRef(widget.dict);
  const byAnnotation = widgetRef
    ? pageByWidget.get(widgetRef.toString())
    : undefined;
  if (byAnnotation !== undefined) {
    return byAnnotation;
  }
  const pageRef = widget.P();
  const byParent = pageRef
    ? doc.getPages().findIndex((page) => page.ref === pageRef)
    : -1;
  return byParent === -1 ? null : byParent;
}

function toRow(top: number): number {
  return Math.round(top / ROW_HEIGHT);
}

const ROW_HEIGHT = 4;

const XFA_MARKER = '/XFA';

const FONT_SIZE_PATTERN = /(\d*\.?\d+)(\s+Tf)/;

const AUTO_FONT_SIZE = 0;

const MIN_FONT_SIZE = 4;

const MAX_FONT_SIZE = 500;

const MAX_LABEL_LENGTH = 80;

const MAX_ENDING_LENGTH = 40;

const SENTENCE_BREAK = /(?<=\.)\s+(?=[A-Z0-9(])/;

const LATIN_ONLY = 'Only Latin characters are supported.';

const UNFILLABLE_KIND_MESSAGES: Record<
  Exclude<PdfFormKind, 'acroform'>,
  string
> = {
  flat: 'This PDF has no form fields to fill. Use a fillable PDF form, or place text at fixed positions with Add Text to PDF.',
  xfa: "This PDF is an XFA form (made with Adobe LiveCycle Designer), which Fill PDF Form cannot fill. Ask the form's publisher for a standard fillable PDF.",
  encrypted:
    'This PDF is encrypted or password-protected, so it cannot be filled. Save a copy without the password or security settings and try again.',
};

const LAYOUT_CHARACTERS = new Set(['\n', '\r', '\t']);

const UNFILLABLE_TYPES: PdfFormFieldType[] = ['button', 'signature'];

type PositionedField = PdfFormField & {
  position: { page: number; top: number; left: number };
};

type Pen = { font: PDFFont; drawableCharacters: Set<number> };

type TextBox = { x: number; y: number; width: number; height: number };

type TextFit =
  | { kind: 'fits' }
  | { kind: 'shrink'; fontSize: number }
  | { kind: 'too-long' };

type PdfFormFieldType =
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'list'
  | 'button'
  | 'signature';

export type PdfFormField = {
  name: string;
  label: string | null;
  type: PdfFormFieldType;
  page: number | null;
  required: boolean;
  readOnly: boolean;
  maxLength: number | null;
  multiline: boolean | null;
  multiSelect: boolean | null;
  options: string[] | null;
  value: PdfFormValue;
};

type PdfFormValue = string | string[] | boolean | null;

type PdfFormKind = 'acroform' | 'xfa' | 'flat' | 'encrypted';

type PdfForm =
  | {
      kind: 'acroform';
      pageCount: number;
      fields: PdfFormField[];
      document: PDFDocument;
    }
  | {
      kind: Exclude<PdfFormKind, 'acroform'>;
      pageCount: number | null;
      fields: [];
      document: null;
    };
