import { describe, expect, it } from 'vitest';
import { slidesText } from '../src/lib/commons/presentation-text';
import { Presentation } from '../src/lib/commons/common';

function shape({ objectId, runs }: { objectId: string; runs: string[] }) {
  return { objectId, shape: { text: { textElements: runs.map((content) => ({ textRun: { content } })) } } };
}

const presentation: Presentation = {
  presentationId: 'pres_1',
  title: 'Deck',
  revisionId: 'rev1',
  layouts: [{ objectId: 'lay1', layoutProperties: { name: 'TITLE_AND_BODY', displayName: 'Title and body' } }],
  slides: [
    {
      objectId: 's1',
      slideProperties: {
        layoutObjectId: 'lay1',
        notesPage: {
          notesProperties: { speakerNotesObjectId: 'n1' },
          pageElements: [shape({ objectId: 'n1', runs: ['Say {{notes_token}}\n'] })],
        },
      },
      pageElements: [
        {
          objectId: 'title1',
          shape: {
            placeholder: { type: 'TITLE' },
            text: { textElements: [{ paragraphMarker: {} }, { textRun: { content: 'Hello {{name}}\n' } }] },
          },
        },
        {
          objectId: 'group1',
          elementGroup: {
            children: [
              shape({ objectId: 'g1', runs: ['Grouped {{grouped}}'] }),
              { objectId: 'inner', elementGroup: { children: [shape({ objectId: 'g2', runs: ['{{deep}}'] }), { objectId: 'c1', sheetsChart: { chartId: 1 } }] } },
            ],
          },
        },
        shape({ objectId: 'split', runs: ['Split {{spl', 'it_token}} here\n'] }),
        {
          objectId: 'table1',
          table: { tableRows: [{ tableCells: [{ text: { textElements: [{ textRun: { content: 'Cell {{cell}}\n' } }] } }, {}] }] },
        },
        { objectId: 'chart_top', sheetsChart: { chartId: 2 } },
        shape({ objectId: 'dupe', runs: ['{{name}} again [[bracket]] {{ spaced }}'] }),
      ],
    },
  ],
};

describe('discoverPlaceholders', () => {
  it('finds tokens in groups (any depth), split runs, table cells and speaker notes, once each', () => {
    expect(slidesText.discoverPlaceholders({ presentation, format: '{{}}' })).toEqual([
      'name',
      'grouped',
      'deep',
      'split_token',
      'cell',
      ' spaced ',
      'notes_token',
    ]);
  });

  it('uses the square-bracket syntax when chosen', () => {
    expect(slidesText.discoverPlaceholders({ presentation, format: '[[]]' })).toEqual(['bracket']);
  });
});

describe('findSheetsCharts', () => {
  it('includes charts inside nested groups', () => {
    expect(slidesText.findSheetsCharts(presentation)).toEqual(['c1', 'chart_top']);
  });
});

describe('buildOutline', () => {
  it('flattens slides with title, text, notes, layout name and element IDs', () => {
    const outline = slidesText.buildOutline(presentation);
    expect(outline.slideCount).toBe(1);
    const slide = outline.slides[0];
    expect(slide).toMatchObject({
      slideNumber: 1,
      objectId: 's1',
      slideUrl: 'https://docs.google.com/presentation/d/pres_1/edit#slide=id.s1',
      layoutName: 'Title and body',
      title: 'Hello {{name}}',
      speakerNotes: 'Say {{notes_token}}',
      isSkipped: false,
    });
    expect(slide.elements.map((element) => element.objectId)).toEqual([
      'title1', 'group1', 'g1', 'inner', 'g2', 'c1', 'split', 'table1', 'chart_top', 'dupe',
    ]);
    expect(slide.elements.find((element) => element.objectId === 'table1')?.text).toBe('Cell {{cell}}');
    expect(slide.text).toContain('Split {{split_token}} here');
  });

  it('returns empty notes when the notes shape does not exist yet', () => {
    expect(
      slidesText.speakerNotesText({
        objectId: 's',
        slideProperties: { notesPage: { notesProperties: { speakerNotesObjectId: 'missing' }, pageElements: [] } },
      })
    ).toBe('');
  });
});
