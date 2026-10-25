#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const DESCRIPTION_FOLD_LIMIT = 70;
const DROPDOWN_TRIGGER_WIDTH = 40;
const HALF_WIDTH_CHARS = 20;
const CARD_OPTION_LIMIT = 4;
const ADVANCED_MIN_RELEASE = '0.88.2';
const TITLE_CASE_SMALL_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'by', 'with', 'as', 'at', 'from', 'per', 'vs', 'is',
]);
const PLACEHOLDER_RENDERING_TYPES = new Set(['SHORT_TEXT', 'LONG_TEXT']);
const GROUP_DISPLAYS_THAT_DISABLE_ADVANCED = new Set(['builder', 'footer']);
const GROUP_DISPLAYS_THAT_FORCE_ESSENTIAL = new Set(['tabs', 'section']);

function usage() {
  return [
    'Usage: node check-step-form.mjs <piece-dir-name> [--url http://localhost:4200] [--include-ai] [--json]',
    '       node check-step-form.mjs --file <piece.json> [--include-ai] [--json]',
    '',
    'Fetches the piece the local dev server serves (AP_DEV_PIECES must include it), or reads a saved',
    'GET /api/v1/pieces/<name> response from --file, and reports',
    'every step-form problem a reviewer would flag: descriptions past the read-more fold,',
    'required props hidden in Advanced, labels with units or question marks, markdown in plain-text',
    'descriptions, placeholders on inputs that never render them, dropdown option labels wider than',
    'the closed trigger, the same prop labelled differently across sibling actions, and a release',
    'floor too low for the advanced flag.',
    '',
    'Exit code 1 when any finding is an error, 0 otherwise.',
  ].join('\n');
}

const FLAGS_WITH_VALUES = new Set(['--url', '--file']);

function parseArgs(argv) {
  const positional = argv.filter((arg, index) => !arg.startsWith('--') && !FLAGS_WITH_VALUES.has(argv[index - 1]));
  const flagValue = (name) => {
    const index = argv.indexOf(name);
    return index === -1 ? undefined : argv[index + 1];
  };
  return {
    pieceDirName: positional[0],
    file: flagValue('--file'),
    url: flagValue('--url') ?? 'http://localhost:4200',
    includeAi: argv.includes('--include-ai'),
    json: argv.includes('--json'),
  };
}

function loadPiece({ file, url, pieceDirName, includeAi }) {
  if (file) {
    return JSON.parse(readFileSync(file, 'utf8'));
  }
  return fetchPiece({ url, pieceDirName, includeAi });
}

async function fetchPiece({ url, pieceDirName, includeAi }) {
  const audience = includeAi ? '?audience=all' : '';
  const endpoint = `${url}/api/v1/pieces/${encodeURIComponent(`@activepieces/piece-${pieceDirName}`)}${audience}`;
  const response = await fetch(endpoint).catch(() => {
    throw new Error(`No dev server answering at ${url}. Start it with "npm start" and make sure "${pieceDirName}" is in AP_DEV_PIECES.`);
  });
  if (!response.ok) {
    throw new Error(`${endpoint} responded ${response.status}. Is the dev server up and is "${pieceDirName}" in AP_DEV_PIECES?`);
  }
  return response.json();
}

function compareSemver({ left, right }) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index];
    }
  }
  return 0;
}

function isTitleCase(label) {
  const words = label.replace(/\(.*?\)/g, '').split(/\s+/).filter((word) => /^[A-Za-z]/.test(word));
  return words.every((word, index) => {
    const lower = word.toLowerCase();
    if (index > 0 && TITLE_CASE_SMALL_WORDS.has(lower)) {
      return true;
    }
    return word[0] === word[0].toUpperCase();
  });
}

function humanSteps({ piece, includeAi }) {
  const actions = Object.values(piece.actions ?? {})
    .filter((action) => includeAi || action.audience !== 'ai')
    .map((action) => ({ kind: 'action', ...action }));
  const triggers = Object.values(piece.triggers ?? {}).map((trigger) => ({ kind: 'trigger', ...trigger }));
  return [...actions, ...triggers];
}

function propFindings({ step, propName, prop }) {
  const findings = [];
  const label = prop.displayName ?? '';
  const description = prop.description ?? '';
  const type = prop.type;
  const add = (level, rule, message) => findings.push({ level, rule, step: step.displayName, prop: propName, message });

  if (type === 'MARKDOWN') {
    if (prop.advanced) {
      add('error', 'markdown-advanced', 'Property.MarkDown does not accept advanced (TS2353); the build will fail.');
    }
    return findings;
  }
  if (description.length > DESCRIPTION_FOLD_LIMIT) {
    add('error', 'description-fold', `Description is ${description.length} chars; the builder folds anything over ${DESCRIPTION_FOLD_LIMIT} behind "show more".`);
  }
  if (/\*\*|`|\[.*\]\(.*\)/.test(description)) {
    add('error', 'description-markdown', 'Description renders as plain text; markdown markers show literally.');
  }
  if (/\n/.test(description)) {
    add('warn', 'description-newline', 'Description contains a line break; it renders as a single wrapped line.');
  }
  if (prop.required && prop.advanced) {
    add('error', 'required-advanced', 'Required prop hidden in Advanced only surfaces as a validation error.');
  }
  if (prop.required && type === 'CHECKBOX') {
    add('warn', 'required-checkbox', 'A checkbox is always answered; required only adds a misleading asterisk.');
  }
  if (prop.required && type === 'OBJECT') {
    add('warn', 'required-object', 'Empty {} passes the OBJECT schema; required is never enforced, only shown.');
  }
  if (/\?\s*$/.test(label)) {
    add('warn', 'label-question', `"${label}": labels are nouns, not questions; drop the "?".`);
  }
  if (/\(.*\)/.test(label)) {
    add('warn', 'label-parenthetical', `"${label}": the parenthetical belongs in the description, not the label.`);
  }
  if (label && !isTitleCase(label)) {
    add('warn', 'label-casing', 'Piece prop labels are Title Case (197:25 across Google pieces); match sibling forms first.');
  }
  if (prop.placeholder && !PLACEHOLDER_RENDERING_TYPES.has(type)) {
    add('warn', 'placeholder-not-rendered', `${type} never renders a placeholder; move the example into the description or drop it.`);
  }
  findings.push(...optionFindings({ step, propName, prop }));
  return findings;
}

function optionFindings({ step, propName, prop }) {
  const options = prop.options?.options;
  if (!Array.isArray(options) || options.length === 0) {
    return [];
  }
  const findings = [];
  const add = (level, rule, message) => findings.push({ level, rule, step: step.displayName, prop: propName, message });
  const labels = options.map((option) => option.label ?? '');
  const longest = labels.reduce((left, right) => (right.length > left.length ? right : left), '');
  const pastFold = labels.filter((label) => label.length > DESCRIPTION_FOLD_LIMIT).length;
  const pastTrigger = labels.filter((label) => label.length > DROPDOWN_TRIGGER_WIDTH).length;
  const worst = `longest is "${longest}" at ${longest.length}`;
  if (pastFold > 0) {
    add('error', 'option-label-fold', `${pastFold} option label(s) over ${DESCRIPTION_FOLD_LIMIT} chars, ${worst}; the list clips them.`);
  } else if (pastTrigger > 0) {
    add('warn', 'option-label-width', `${pastTrigger} option label(s) over ${DROPDOWN_TRIGGER_WIDTH} chars, ${worst}; the closed dropdown is about ${DROPDOWN_TRIGGER_WIDTH} wide and shows the label only. Move the code or pattern into the option description.`);
  }
  if (prop.width === 'half' && longest.length > HALF_WIDTH_CHARS) {
    add('warn', 'half-width-option', `A half-width field is about ${HALF_WIDTH_CHARS} chars wide, ${worst}; stack the field full width or shorten the labels.`);
  }
  if (prop.display === 'cards' && options.length > CARD_OPTION_LIMIT) {
    add('warn', 'cards-option-count', `${options.length} options as cards; cards hold ${CARD_OPTION_LIMIT} short modes, more belongs in a plain dropdown.`);
  }
  return findings;
}

function stepFindings({ step }) {
  const findings = [];
  const props = Object.entries(step.props ?? {});
  const add = (level, rule, message) => findings.push({ level, rule, step: step.displayName, prop: '', message });

  props.forEach(([propName, prop]) => findings.push(...propFindings({ step, propName, prop })));

  const inputProps = props.filter(([, prop]) => prop.type !== 'MARKDOWN');
  const advancedProps = inputProps.filter(([, prop]) => prop.advanced);
  if (inputProps.length > 0 && advancedProps.length === inputProps.length) {
    add('error', 'all-advanced', `Every input is in Advanced; the form opens as "Advanced, ${advancedProps.length} option(s)" and nothing else.`);
  }

  const groups = step.propertyGroups ?? [];
  const disablesAdvanced = groups.some((group) => GROUP_DISPLAYS_THAT_DISABLE_ADVANCED.has(group.display));
  if (disablesAdvanced && advancedProps.length > 0) {
    add('error', 'advanced-with-builder', 'A builder or footer group forces every prop essential; advanced does nothing here.');
  }
  groups
    .filter((group) => GROUP_DISPLAYS_THAT_FORCE_ESSENTIAL.has(group.display))
    .forEach((group) => {
      group.props
        .filter((memberName) => step.props?.[memberName]?.advanced)
        .forEach((memberName) => add('warn', 'advanced-in-group', `"${memberName}" is in the ${group.display} group "${group.key}", so advanced is ignored.`));
    });
  const grouped = new Set(groups.flatMap((group) => group.props));
  if (groups.some((group) => group.display === 'section') && inputProps.some(([name]) => !grouped.has(name))) {
    add('warn', 'ungrouped-below-sections', 'Ungrouped props render below every section card; check the resulting order.');
  }
  return findings;
}

function siblingFindings({ steps }) {
  const byPropName = new Map();
  steps.forEach((step) => {
    Object.entries(step.props ?? {}).forEach(([propName, prop]) => {
      if (prop.type === 'MARKDOWN') {
        return;
      }
      const entries = byPropName.get(propName) ?? [];
      entries.push({ step: step.displayName, label: prop.displayName ?? '', description: prop.description ?? '' });
      byPropName.set(propName, entries);
    });
  });
  const findings = [];
  byPropName.forEach((entries, propName) => {
    const labels = new Set(entries.map((entry) => entry.label));
    const descriptions = new Set(entries.map((entry) => entry.description));
    if (labels.size > 1) {
      findings.push({ level: 'warn', rule: 'sibling-label', step: entries.map((entry) => entry.step).join(', '), prop: propName, message: `Same prop, ${labels.size} labels: ${[...labels].map((label) => `"${label}"`).join(' / ')}.` });
    }
    if (descriptions.size > 1) {
      findings.push({ level: 'info', rule: 'sibling-description', step: entries.map((entry) => entry.step).join(', '), prop: propName, message: `Same prop, ${descriptions.size} descriptions; fine when the context differs, a defect when it does not.` });
    }
  });
  return findings;
}

function pieceFindings({ piece, steps }) {
  const findings = [];
  const usesAdvanced = steps.some((step) => Object.values(step.props ?? {}).some((prop) => prop.advanced));
  const floor = piece.minimumSupportedRelease ?? '0.0.0';
  if (usesAdvanced && compareSemver({ left: floor, right: ADVANCED_MIN_RELEASE }) < 0) {
    findings.push({ level: 'error', rule: 'min-release', step: '', prop: '', message: `advanced needs minimumSupportedRelease >= ${ADVANCED_MIN_RELEASE}; piece declares ${floor}, older self-hosted renders the fields inline.` });
  }
  return findings;
}

function render({ piece, steps, skippedAi, findings }) {
  const lines = [];
  const aiCount = Object.values(piece.actions ?? {}).filter((action) => action.audience === 'ai').length;
  const aiNote = aiCount === 0
    ? ' (the server already filtered AI-only actions out)'
    : skippedAi > 0 ? ` (${skippedAi} AI-only actions skipped)` : ` (${aiCount} AI-only actions included)`;
  const actionWord = skippedAi === 0 && aiCount > 0 ? 'actions' : 'human actions';
  lines.push(`${piece.displayName} ${piece.version} — ${steps.filter((step) => step.kind === 'action').length} ${actionWord}, ${steps.filter((step) => step.kind === 'trigger').length} triggers${aiNote}`);
  lines.push('');
  const byStep = new Map();
  findings.forEach((finding) => {
    const key = finding.step || '(piece)';
    byStep.set(key, [...(byStep.get(key) ?? []), finding]);
  });
  byStep.forEach((stepFindingsList, stepName) => {
    lines.push(stepName);
    stepFindingsList.forEach((finding) => {
      const target = finding.prop ? ` ${finding.prop}` : '';
      lines.push(`  ${finding.level.toUpperCase().padEnd(5)} ${finding.rule.padEnd(24)}${target}: ${finding.message}`);
    });
    lines.push('');
  });
  const count = (level) => findings.filter((finding) => finding.level === level).length;
  lines.push(`${count('error')} error(s), ${count('warn')} warning(s), ${count('info')} info`);
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.pieceDirName && !args.file) {
    console.log(usage());
    process.exit(2);
  }
  const piece = await loadPiece(args);
  const steps = humanSteps({ piece, includeAi: args.includeAi });
  const skippedAi = Object.values(piece.actions ?? {}).length - steps.filter((step) => step.kind === 'action').length;
  const findings = [
    ...steps.flatMap((step) => stepFindings({ step })),
    ...siblingFindings({ steps }),
    ...pieceFindings({ piece, steps }),
  ];
  if (args.json) {
    console.log(JSON.stringify({ piece: piece.displayName, version: piece.version, findings }, null, 2));
  } else {
    console.log(render({ piece, steps, skippedAi, findings }));
  }
  process.exit(findings.some((finding) => finding.level === 'error') ? 1 : 0);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(2);
});
