import { PropertyType } from '@activepieces/pieces-framework';
import { docs_v1 } from '@googleapis/docs';
import { describe, expect, it, vi } from 'vitest';
import { templateFill } from './template-fill';
import {
  buildImageInputs,
  buildPlaceholderInputs,
  runTemplateFill,
  TemplateClients,
  TemplateFillInput,
} from './template-fill-run';

describe('runTemplateFill', () => {
  it('writes into the template itself for a flow saved before the copy option existed', async () => {
    const clients = stubClients();

    const output = await runTemplateFill({ clients, input: { ...baseInput, values: { name: 'Ada' } } });

    expect(clients.copyFile).not.toHaveBeenCalled();
    expect(clients.batchUpdate).toHaveBeenCalledWith({
      documentId: 'template-id',
      requests: [{ replaceAllText: { containsText: { text: '{{name}}', matchCase: true }, replaceText: 'Ada' } }],
    });
    expect(output).toEqual({
      documentId: 'template-id',
      documentName: 'Offer letter',
      documentUrl: 'https://docs.google.com/document/d/template-id/edit',
      templateId: 'template-id',
      createdNewDocument: false,
      replacements: [{ placeholder: '{{name}}', key: 'name', occurrences: 1 }],
      totalReplacements: 1,
      placeholdersNotFound: [],
      unfilledPlaceholders: ['{{date}}'],
      imagesReplaced: 0,
      data: { documentId: 'template-id', replies: [{ replaceAllText: { occurrencesChanged: 1 } }] },
    });
  });

  it('fills a copy and leaves the template alone', async () => {
    const clients = stubClients();

    const output = await runTemplateFill({
      clients,
      input: {
        ...baseInput,
        createCopy: true,
        newDocumentName: 'Offer for Ada',
        folderId: 'folder-id',
        values: { name: 'Ada' },
      },
    });

    expect(clients.copyFile).toHaveBeenCalledWith({
      fileId: 'template-id',
      name: 'Offer for Ada',
      folderId: 'folder-id',
    });
    expect(clients.batchUpdate).toHaveBeenCalledWith(expect.objectContaining({ documentId: 'copy-id' }));
    expect(output).toMatchObject({
      documentId: 'copy-id',
      documentName: 'Offer for Ada',
      documentUrl: 'https://docs.google.com/document/d/copy-id/edit',
      templateId: 'template-id',
      createdNewDocument: true,
    });
  });

  it('moves the copy to the trash when filling it fails', async () => {
    const clients = stubClients();
    clients.batchUpdate.mockRejectedValue(new Error('There was a problem retrieving the image.'));

    await expect(
      runTemplateFill({ clients, input: { ...baseInput, createCopy: true, values: { name: 'Ada' } } }),
    ).rejects.toThrow('There was a problem retrieving the image.');
    expect(clients.trashFile).toHaveBeenCalledWith('copy-id');
  });

  it('names the leftover copy when moving it to the trash also fails', async () => {
    const clients = stubClients();
    clients.batchUpdate.mockRejectedValue(new Error('There was a problem retrieving the image.'));
    clients.trashFile.mockRejectedValue(new Error('insufficientFilePermissions'));

    await expect(
      runTemplateFill({ clients, input: { ...baseInput, createCopy: true, values: { name: 'Ada' } } }),
    ).rejects.toThrow(
      'There was a problem retrieving the image. The new document copy-id could not be moved to the trash (insufficientFilePermissions). Delete it by hand.',
    );
  });

  it('never trashes the template when an in-place fill fails', async () => {
    const clients = stubClients();
    clients.batchUpdate.mockRejectedValue(new Error('boom'));

    await expect(runTemplateFill({ clients, input: { ...baseInput, values: { name: 'Ada' } } })).rejects.toThrow(
      'boom',
    );
    expect(clients.trashFile).not.toHaveBeenCalled();
  });

  it('stops before copying or writing when a placeholder is missing and the check is on', async () => {
    const clients = stubClients();

    await expect(
      runTemplateFill({
        clients,
        input: { ...baseInput, createCopy: true, failOnMissing: true, values: { name: 'Ada', ghost: 'x' } },
      }),
    ).rejects.toThrow('These placeholders were not found in the template: {{ghost}}. Nothing was changed.');
    expect(clients.copyFile).not.toHaveBeenCalled();
    expect(clients.batchUpdate).not.toHaveBeenCalled();
  });

  it('reports a missing placeholder without failing when the check is off', async () => {
    const clients = stubClients();
    clients.batchUpdate.mockResolvedValue({ documentId: 'template-id', replies: [{ replaceAllText: {} }] });

    const output = await runTemplateFill({ clients, input: { ...baseInput, values: { ghost: 'x' } } });

    expect(output.placeholdersNotFound).toEqual(['{{ghost}}']);
  });

  it('makes no write call when there is nothing to replace', async () => {
    const clients = stubClients();

    const output = await runTemplateFill({ clients, input: { ...baseInput, createCopy: true } });

    expect(clients.batchUpdate).not.toHaveBeenCalled();
    expect(output).toMatchObject({ documentId: 'copy-id', totalReplacements: 0, data: { replies: [] } });
  });
});

describe('buildPlaceholderInputs', () => {
  it('gives one optional text input per placeholder', () => {
    const inputs = buildPlaceholderInputs({ scan: scanOf('{{name}} {{date}}'), format: '{{KEY}}' });

    expect(Object.keys(inputs)).toEqual(['name', 'date']);
    expect(inputs['name']).toMatchObject({ displayName: 'name', required: false, type: PropertyType.SHORT_TEXT });
  });

  it('explains what to do when the template has no placeholders', () => {
    const inputs = buildPlaceholderInputs({ scan: scanOf('plain text'), format: '[[KEY]]' });

    expect(Object.keys(inputs)).toEqual(['template_note']);
    expect(inputs['template_note']).toMatchObject({ type: PropertyType.MARKDOWN });
    expect(inputs['template_note'].description).toContain('No [[name]] placeholders were found');
  });

  it('caps a very long list and says so', () => {
    const text = Array.from({ length: 130 }, (_, index) => `{{p${index}}}`).join(' ');

    const inputs = buildPlaceholderInputs({ scan: scanOf(text), format: '{{KEY}}' });

    expect(Object.keys(inputs)).toHaveLength(101);
    expect(inputs['template_note'].description).toContain('Showing the first 100 of 130 placeholders');
  });
});

describe('buildImageInputs', () => {
  it('labels each image with its position and alt text', () => {
    const inputs = buildImageInputs({
      scan: templateFill.scan({
        document: {
          body: {
            content: [
              { paragraph: { elements: [{ inlineObjectElement: { inlineObjectId: 'kix.a' } }] } },
              { paragraph: { elements: [{ inlineObjectElement: { inlineObjectId: 'kix.b' } }] } },
            ],
          },
          inlineObjects: {
            'kix.a': { inlineObjectProperties: { embeddedObject: { title: 'Logo', imageProperties: {} } } },
            'kix.b': { inlineObjectProperties: { embeddedObject: { imageProperties: {} } } },
          },
        },
        format: '{{KEY}}',
      }),
    });

    expect(Object.entries(inputs).map(([key, input]) => [key, input.displayName])).toEqual([
      ['kix.a', 'Image 1: Logo'],
      ['kix.b', 'Image 2'],
    ]);
  });
});

function scanOf(text: string) {
  return templateFill.scan({ document: documentOf(text), format: '{{KEY}}' });
}

function documentOf(text: string): docs_v1.Schema$Document {
  return {
    title: 'Offer letter',
    tabs: [
      {
        tabProperties: { tabId: 't.0' },
        documentTab: { body: { content: [{ paragraph: { elements: [{ textRun: { content: text } }] } }] } },
      },
    ],
  };
}

function stubClients() {
  return {
    getDocument: vi.fn<TemplateClients['getDocument']>().mockResolvedValue(documentOf('Dear {{name}}, {{date}}')),
    batchUpdate: vi
      .fn<TemplateClients['batchUpdate']>()
      .mockImplementation(async ({ documentId }) => ({
        documentId,
        replies: [{ replaceAllText: { occurrencesChanged: 1 } }],
      })),
    copyFile: vi
      .fn<TemplateClients['copyFile']>()
      .mockImplementation(async ({ name }) => ({ id: 'copy-id', name: name ?? 'Copy of Offer letter' })),
    trashFile: vi.fn<TemplateClients['trashFile']>().mockResolvedValue(undefined),
  };
}

const baseInput: TemplateFillInput = {
  templateId: 'template-id',
  format: '{{KEY}}',
  createCopy: false,
  failOnMissing: false,
};
