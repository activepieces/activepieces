import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';

export function ReceiptOutputBody({ output }: { output: unknown }) {
  if (output == null) return null;
  return (
    <div className="overflow-hidden rounded-lg bg-muted/30">
      <SimpleJsonViewer
        data={tryParseJson(output)}
        hideCopyButton={true}
        maxHeight={150}
        fontSize="11px"
      />
    </div>
  );
}

function tryParseJson(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}
