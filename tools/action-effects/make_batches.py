#!/usr/bin/env python3
"""Turn the action catalog into self-contained Codex prompts, one per batch.

Batches keep same-piece actions together (shared app context = shorter prompts,
better judgement) and are deterministic, so a re-run resumes instead of reshuffling.
"""
import json
import os
import sys

CATALOG = sys.argv[1] if len(sys.argv) > 1 else 'catalog.jsonl'
OUTDIR = sys.argv[2] if len(sys.argv) > 2 else 'batches'
SIZE = int(sys.argv[3]) if len(sys.argv) > 3 else 40

TAXONOMY = """You label Activepieces integration actions so an AI agent knows which ones must ask a human before running.

For every action, decide what happens IN THE REAL WORLD when it runs, and pick exactly ONE label:

- read             only reads or returns data; changes nothing anywhere.
- external_write    creates or changes data in the third-party system, and no human is notified by it.
- outward_send      causes a message to reach a person or a public audience: email, SMS, chat/DM/channel message, push notification, phone call, social post, public comment, invitation.
- destructive       permanently deletes or irreversibly removes data, records or resources.
- financial         moves money or creates a financial obligation: charge, payment, refund, payout, transfer, issuing or sending an invoice, placing an order, starting or cancelling a paid subscription.
- input_dependent   what it does is decided entirely by input the caller supplies, so it cannot be known in advance: raw SQL / database query runners, raw HTTP or GraphQL requests, "custom API call", arbitrary code or script execution.

If more than one fits, highest precedence wins: input_dependent > financial > destructive > outward_send > external_write > read.

Rules:
- Judge the ACTION, not the app. "Stripe list customers" is read. "Slack list channels" is read.
- EVERY action here belongs to a third-party integration. Writing "into the app" is still external_write — there is no such thing as an internal write in this payload.
- financial is only for actual money movement or obligation. Defining a price, product, plan or catalog entry is external_write.
- Creating a DRAFT that is not sent is external_write, not outward_send.
- Uploading or attaching a file to a third-party service is external_write.
- Starting/stopping a device, session, job or deploy is external_write, unless it costs money (then financial).
- Adding a tag/label/member/comment inside a system nobody is notified about is external_write.
- search / get / list / find / count / read / export / download that only pulls data is read.
- Names are often camelCase or vague — lean on displayName, description and props.
- recipientProp: when the action sends something to someone, the prop key naming the recipient ("to", "channel", "phoneNumber", ...). Otherwise null.
- confidence: "high" only when the description makes it obvious. Use "low" when you are guessing — low-confidence ones get a second pass with web search, so never guess silently.
- note: only when confidence is not high. Max 12 words.

Everything you need is in the payload below. Do NOT read files, run commands, or search the web on this pass.
Return one entry per input action, echoing `action` exactly. Never add, drop, merge or rename entries."""


def compact(rec):
    out = {'action': rec['action'], 'app': rec['piece']}
    if rec.get('displayName'):
        out['title'] = rec['displayName']
    desc = rec.get('aiDescription') or rec.get('description')
    if desc:
        out['what'] = desc[:320]
    if rec.get('props'):
        out['inputs'] = rec['props'][:14]
    return out


records = [json.loads(line) for line in open(CATALOG, encoding='utf8')]
os.makedirs(OUTDIR, exist_ok=True)

batches, current, current_piece_count = [], [], 0
for rec in records:
    current.append(rec)
    if len(current) >= SIZE:
        batches.append(current)
        current = []
if current:
    batches.append(current)

for i, batch in enumerate(batches):
    payload = [compact(r) for r in batch]
    path = os.path.join(OUTDIR, f'batch_{i:04d}.txt')
    with open(path, 'w', encoding='utf8') as fh:
        fh.write(TAXONOMY)
        fh.write('\n\nACTIONS:\n')
        fh.write(json.dumps(payload, ensure_ascii=False, indent=1))
        fh.write('\n')
    with open(os.path.join(OUTDIR, f'batch_{i:04d}.ids'), 'w', encoding='utf8') as fh:
        for r in batch:
            fh.write(f"{r['piece']}\t{r['action']}\n")

sizes = [os.path.getsize(os.path.join(OUTDIR, f'batch_{i:04d}.txt')) for i in range(len(batches))]
print(f'batches={len(batches)} size={SIZE} avg_prompt_chars={sum(sizes)//len(sizes)} '
      f'≈{sum(sizes)//len(sizes)//4} tokens/batch')
