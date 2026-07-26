#!/usr/bin/env python3
"""Exact, hand-reasoned effect labels for the Activepieces built-in pieces.

These 91 actions are the ones the agent uses constantly, so a wrong label here is
felt on every task: too strict and it nags on its own Tables, too loose and it
lets a whole table get cleared silently. Labeled by hand, not by model.

Vocabulary (same as the model pass, plus the internal_* pair only built-ins can be):
  read                 changes nothing anywhere (includes pure computation)
  internal_write       writes only inside Activepieces (its Tables, Store, files, credits)
  internal_destructive removes the user's own data inside Activepieces
  input_dependent      what it does is decided by input, so it cannot be known up front
"""
import json
import sys

# Whole pieces that are pure computation — no state anywhere.
PURE_READ_PIECES = {'crypto', 'csv', 'data-mapper', 'date-helper', 'delay',
                    'json', 'math-helper', 'text-helper', 'xml'}

OVERRIDES = {
    # AI actions spend platform credits but touch nothing outside Activepieces.
    ('ai', 'askAi'): 'internal_write',
    ('ai', 'classifyText'): 'internal_write',
    ('ai', 'extractStructuredData'): 'internal_write',
    ('ai', 'generateImage'): 'internal_write',
    ('ai', 'summarizeText'): 'internal_write',
    # An agent picks its own tools at runtime — its effects are unknowable here.
    ('ai', 'run_agent'): 'input_dependent',

    ('approval', 'create_approval_links'): 'internal_write',
    ('approval', 'wait_for_approval'): 'read',

    ('file-helper', 'change_file_encoding'): 'internal_write',
    ('file-helper', 'createFile'): 'internal_write',
    ('file-helper', 'get_file_name'): 'read',
    ('file-helper', 'read_file'): 'read',
    ('file-helper', 'unzipFile'): 'internal_write',
    ('file-helper', 'zipFiles'): 'internal_write',

    ('forms', 'return_response'): 'internal_write',

    # Raw request builders: the caller supplies method, URL and body.
    ('graphql', 'send_request'): 'input_dependent',
    ('http', 'send_request'): 'input_dependent',
    ('http', 'parse_url'): 'read',

    ('image-helper', 'compress_image'): 'internal_write',
    ('image-helper', 'convert_image_format'): 'internal_write',
    ('image-helper', 'crop_image'): 'internal_write',
    ('image-helper', 'resize_image'): 'internal_write',
    ('image-helper', 'rotate_image'): 'internal_write',
    ('image-helper', 'get_meta_data'): 'read',
    ('image-helper', 'image_to_base64'): 'read',

    ('queue', 'push-to-queue'): 'internal_write',
    ('queue', 'pull-from-queue'): 'internal_write',
    ('queue', 'clear-queue'): 'internal_destructive',

    ('store', 'get'): 'read',
    ('store', 'put'): 'internal_write',
    ('store', 'append'): 'internal_write',
    ('store', 'add_to_list'): 'internal_write',
    ('store', 'remove_value'): 'internal_destructive',
    ('store', 'remove_from_list'): 'internal_destructive',

    # Calling another flow runs whatever that flow does — including real sends.
    ('subflows', 'callFlow'): 'input_dependent',
    ('subflows', 'returnResponse'): 'internal_write',

    ('tables', 'tables-find-records'): 'read',
    ('tables', 'tables-get-record'): 'read',
    ('tables', 'tables-download-table'): 'read',
    ('tables', 'tables-create-records'): 'internal_write',
    ('tables', 'tables-create-table'): 'internal_write',
    ('tables', 'tables-update-record'): 'internal_write',
    ('tables', 'tables-delete-record'): 'internal_destructive',
    ('tables', 'tables-delete-table'): 'internal_destructive',
    ('tables', 'tables-clear-table'): 'internal_destructive',

    ('webhook', 'return_response'): 'internal_write',
    ('webhook', 'return_response_and_wait_for_next_webhook'): 'internal_write',
}

catalog = [json.loads(line) for line in open(sys.argv[1], encoding='utf8')]
labels = {}
missing = []
for rec in catalog:
    key = (rec['piece'], rec['action'])
    if key in OVERRIDES:
        effect = OVERRIDES[key]
    elif rec['piece'] in PURE_READ_PIECES:
        effect = 'read'
    else:
        missing.append(key)
        continue
    labels[f"@activepieces/piece-{rec['piece']}:{rec['action']}"] = {
        'effect': effect,
        'recipientProp': None,
        'confidence': 'high',
        'source': 'hand',
    }

json.dump(labels, open(sys.argv[2], 'w'), indent=0, sort_keys=True)
print(f'hand-labeled={len(labels)} unlabeled={len(missing)}')
for key in missing:
    print('  MISSING', key)
