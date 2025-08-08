const fs = require('fs');

function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node format-checkly-report.js <path-to-md> [environment]');
    process.exit(1);
  }

  const mdPath = process.argv[2];
  const environment = process.argv[3];
  const content = fs.readFileSync(mdPath, 'utf8');

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

  let message = '';
  if (environment) {
    message += `**Environment:** ${environment}\n\n`;
  }
  for (const l of summaryLines) {
    if (l.trim()) {
      message += l + '\n';
    }
  }
  if (bulletPoints.length) {
    message += '\n**Test Results:**\n';
    message += bulletPoints.join('\n');
  }

  console.log(JSON.stringify(message));
}

main();
