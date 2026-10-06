import { Property } from '@activepieces/pieces-framework';

function presentationIdProp(displayName = 'Presentation') {
  return Property.ShortText({
    displayName,
    description:
      'The presentation ID or its full URL, e.g. https://docs.google.com/presentation/d/1AbC...xyz/edit or just 1AbC...xyz.',
    required: true,
  });
}

function folderIdProp(description: string) {
  return Property.ShortText({
    displayName: 'Folder',
    description,
    required: false,
  });
}

function slideNumberProp() {
  return Property.Number({
    displayName: 'Slide Number',
    description: 'Position of the slide in the deck, starting at 1 for the first slide. Set this or Slide Object ID, not both.',
    required: false,
  });
}

function slideObjectIdProp() {
  return Property.ShortText({
    displayName: 'Slide Object ID',
    description:
      'The slide object ID (e.g. "g2c8d1e5a7f_0_12", from Get Presentation Outline), or the slide URL copied from the browser while the slide is selected (it ends in #slide=id.<objectId>). Set this or Slide Number, not both.',
    required: false,
  });
}

function matchCaseProp() {
  return Property.Checkbox({
    displayName: 'Match Case',
    description: 'When on, "Name" does not match "name".',
    required: false,
    defaultValue: true,
  });
}

function slideScopeProp() {
  return Property.Array({
    displayName: 'Only on These Slides',
    description:
      'Optional list of slide object IDs (or slide URLs) to limit the change to. Leave empty for every slide. Speaker notes pages cannot be listed here.',
    required: false,
  });
}

function elementIdProp({ displayName, description }: { displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required: true });
}

function textElementIdProp() {
  return elementIdProp({
    displayName: 'Element Object ID',
    description:
      'Object ID of the shape, text box, placeholder or table, e.g. "g2c8d1e5a7f_0_3". Get it from List Slide Elements, Get Presentation Outline (elements[].objectId), or the output of Create Shape / Create Table. For a table also set Row and Column.',
  });
}

function cellRowProp() {
  return Property.Number({
    displayName: 'Row',
    description: 'Table cells only: row number, starting at 1. Leave empty for shapes and text boxes.',
    required: false,
  });
}

function cellColumnProp() {
  return Property.Number({
    displayName: 'Column',
    description: 'Table cells only: column number, starting at 1. Leave empty for shapes and text boxes.',
    required: false,
  });
}

function textRangeProps() {
  return {
    match_text: Property.ShortText({
      displayName: 'Match Text',
      description:
        'Optional: only change every occurrence of this exact text (case-sensitive) inside the element. Leave empty (and Start/End Index empty) for all of its text.',
      required: false,
    }),
    start_index: Property.Number({
      displayName: 'Start Index',
      description: 'Optional 0-based start of a character range (instead of Match Text).',
      required: false,
    }),
    end_index: Property.Number({
      displayName: 'End Index',
      description: 'Optional 0-based end of the range, exclusive (instead of Match Text).',
      required: false,
    }),
  };
}

function pointProp({ displayName, description, required }: { displayName: string; description: string; required: boolean }) {
  return Property.Number({ displayName, description, required });
}

function colorProp({ displayName, description }: { displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required: false });
}

function enumProp({
  displayName,
  description,
  values,
  required = false,
}: {
  displayName: string;
  description: string;
  values: readonly string[];
  required?: boolean;
}) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: { disabled: false, options: values.map((value) => ({ label: value, value })) },
  });
}

export const slidesProps = {
  elementIdProp,
  textElementIdProp,
  textRangeProps,
  cellRowProp,
  cellColumnProp,
  pointProp,
  colorProp,
  enumProp,
  presentationIdProp,
  folderIdProp,
  slideNumberProp,
  slideObjectIdProp,
  matchCaseProp,
  slideScopeProp,
};
