const fs = require('fs');

function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node format-checkly-report.js <path-to-md>');
    process.exit(1);
  }

  const mdPath = process.argv[2];
  const content = fs.readFileSync(mdPath, 'utf8');

  const header = '❌ **Checkly E2E tests are failing in the workflow!**\n\n';
  const lines = content.split('\n');
  const bulletPoints = [];
  const summaryLines = [];
  let inTable = false;

  for (const line of lines) {
    if (line.startsWith('|Result|')) {
      inTable = true;
      continue;
    }
    if (inTable && (line.startsWith('|:-') || !line.trim())) {
      continue;
    }
    if (inTable && line.includes('|')) {
      const parts = line.split('|').map(part => part.trim()).filter(Boolean);
      if (parts.length >= 5) {
        const status = parts[0];
        const name = parts[1];
        const checkType = parts[2];
        const filename = parts[3].replace(/`/g, '');
        const duration = parts[4];
        // Try to extract link if present
        const linkMatch = line.match(/\[Full test report\]\((.*?)\)/);
        const link = linkMatch ? linkMatch[1] : null;
        const emoji = status.includes('Fail') ? '❌' : '✅';
        let point = `${emoji} **${name}** (${checkType}) - ${duration}\n   📁 ${filename}`;
        if (link) {
          point += `\n   🔗 [Full report](${link})`;
        }
        bulletPoints.push(point);
      }
    } else if (!inTable) {
      summaryLines.push(line);
    }
  }

  // Compose message
  let message = header;
  for (const l of summaryLines) {
    if (l.trim()) {
      message += l + '\n';
    }
  }
  if (bulletPoints.length) {
    message += '\n**Test Results:**\n';
    message += bulletPoints.join('\n');
  }

  // Output as JSON string for workflow usage
  console.log(JSON.stringify(message));
}

main();
