const axios = require('axios');
const fs = require('fs/promises');

const LIST_ENDPOINT = 'http://127.0.0.1:4200/api/v1/pieces';
const OUTPUT_FILE = 'pieces-extended.md';

async function fetchPieces() {
  const response = await axios.get(LIST_ENDPOINT);
  return response.data;
}

async function fetchPieceDetail(pieceName) {
  const response = await axios.get(`${LIST_ENDPOINT}/${pieceName}`);
  return response.data;
}

function getCategories(item) {
  if (Array.isArray(item.categories) && item.categories.length > 0) {
    return item.categories.join(', ');
  }
  return 'None';
}

function getAuthSummary(item) {
  const auth = item.auth;
  if (!auth) return 'No authentication required';

  const authType = auth.type || 'Unknown Type';
  const props = auth.props || {};
  const fields = typeof props === 'object' ? Object.keys(props).join(', ') : 'None';

  return `**Type**: ${authType} | **Fields**: ${fields}`;
}

async function generateMarkdown() {
  let markdown = '# Pieces Overview\n\nBelow are all the pieces AutomationX supports currently. You can use these pieces to create workflows\n\n';

  let pieces;
  try {
    pieces = await fetchPieces();
  } catch (err) {
    console.error('Failed to fetch pieces:', err.message);
    process.exit(1);
  }

  for (const item of pieces) {
    const displayName = item.displayName || 'N/A';
    const pieceName = item.name;
    const description = (item.description || '').trim() || 'No description provided.';
    const categories = getCategories(item);
    const authSummary = getAuthSummary(item);

    let actionsMd = '';
    let triggersMd = '';

    try {
      const extended = await fetchPieceDetail(pieceName);

      if (extended.actions && Object.keys(extended.actions).length) {
        actionsMd += '\n**Actions:**\n';
        let i = 1;
        for (const key in extended.actions) {
          const act = extended.actions[key];
          actionsMd += `${i++}. ${act.displayName}: ${act.description}\n`;
        }
      }

      if (extended.triggers && Object.keys(extended.triggers).length) {
        triggersMd += '\n**Triggers:**\n';
        let i = 1;
        for (const key in extended.triggers) {
          const trig = extended.triggers[key];
          triggersMd += `${i++}. ${trig.displayName}: ${trig.description}\n`;
        }
      }
    } catch (err) {
      console.warn(`Error fetching details for ${pieceName}:`, err.message);
      continue;
    }

    markdown += `## ${displayName}
- **Piece**: ${displayName}
- **Description**: ${description}
- **Authentication**: ${authSummary}
- **Categories**: ${categories}
${actionsMd}
${triggersMd}
---
`;
  }

  await fs.writeFile(OUTPUT_FILE, markdown, 'utf-8');
  console.log(`✅ Markdown written to '${OUTPUT_FILE}'`);
}

generateMarkdown();
