const SAFE_LINK = /^(https?:|mailto:|matrix:)/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function toSafeHtml(markdown: string): Promise<string> {
  const { marked } = await import('marked');
  const renderer = new marked.Renderer();
  renderer.html = (html: string) => escapeHtml(html);
  renderer.link = (href: string | null, title: string | null, text: string) => {
    if (!href || !SAFE_LINK.test(href.trim())) return text;
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${escapeHtml(href.trim())}"${titleAttr}>${text}</a>`;
  };
  renderer.image = (href: string | null, _title: string | null, text: string) => {
    const label = escapeHtml(text || 'image');
    if (!href || !/^https?:/i.test(href.trim())) return label;
    return `<a href="${escapeHtml(href.trim())}">${label}</a>`;
  };
  return marked.parse(markdown, { renderer, mangle: false, headerIds: false }).trim();
}

export const matrixMarkdown = { toSafeHtml, escapeHtml };
