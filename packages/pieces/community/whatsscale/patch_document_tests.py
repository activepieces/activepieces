import os

base = '/root/activepieces/packages/pieces/community/whatsscale/src/lib/actions/messaging'

fixes = {
    'send-document-to-contact.test.ts': [
        (
            "expect(prepareFile).toHaveBeenCalledWith('test-api-key', 'https://example.com/doc.pdf');",
            "expect(prepareFile).toHaveBeenCalledWith('test-api-key', 'https://example.com/doc.pdf', 'document');"
        ),
        (
            "expect(prepareFile).toHaveBeenCalledWith('my-secret-key', expect.anything());",
            "expect(prepareFile).toHaveBeenCalledWith('my-secret-key', expect.anything(), 'document');"
        ),
    ],
    'send-document-to-group.test.ts': [
        (
            "expect(prepareFile).toHaveBeenCalledWith('test-api-key', 'https://example.com/doc.pdf');",
            "expect(prepareFile).toHaveBeenCalledWith('test-api-key', 'https://example.com/doc.pdf', 'document');"
        ),
        (
            "expect(prepareFile).toHaveBeenCalledWith('my-secret-key', expect.anything());",
            "expect(prepareFile).toHaveBeenCalledWith('my-secret-key', expect.anything(), 'document');"
        ),
    ],
    'send-document-to-crm-contact.test.ts': [
        (
            "expect(prepareFile).toHaveBeenCalledWith('test-api-key', 'https://example.com/doc.pdf');",
            "expect(prepareFile).toHaveBeenCalledWith('test-api-key', 'https://example.com/doc.pdf', 'document');"
        ),
        (
            "expect(prepareFile).toHaveBeenCalledWith('my-secret-key', expect.anything());",
            "expect(prepareFile).toHaveBeenCalledWith('my-secret-key', expect.anything(), 'document');"
        ),
    ],
}

for filename, replacements in fixes.items():
    filepath = os.path.join(base, filename)
    with open(filepath, 'r') as f:
        content = f.read()
    for old, new in replacements:
        if old not in content:
            print(f"ERROR: Could not find in {filename}:\n  {old}")
            exit(1)
        content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"✓ Patched {filename}")

print("\n✅ All 3 test files updated")
