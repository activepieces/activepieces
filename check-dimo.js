#!/usr/bin/env node

/**
 * DIMO Piece MCP Verification Script
 * 
 * This script validates that the DIMO piece has comprehensive MCP support
 * by analyzing the source code and action definitions.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIMO Piece MCP Verification Script\n');
console.log('=' .repeat(80));

// Path to DIMO source
const dimoSrcPath = path.join(__dirname, 'packages/pieces/community/dimo/src');

if (!fs.existsSync(dimoSrcPath)) {
  console.error('❌ Error: DIMO source not found at:', dimoSrcPath);
  process.exit(1);
}

console.log('✅ Found DIMO source at:', dimoSrcPath);
console.log('');

// Read the main index file
const indexPath = path.join(dimoSrcPath, 'index.ts');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

// Parse piece info
const displayNameMatch = indexContent.match(/displayName:\s*['"]([^'"]+)['"]/);
const descriptionMatch = indexContent.match(/description:\s*['"]([^'"]+)['"]/);

const report = {
  displayName: displayNameMatch ? displayNameMatch[1] : 'N/A',
  description: descriptionMatch ? descriptionMatch[1] : 'N/A',
  actionCategories: {},
  totalActions: 0,
  actionsWithFullMCP: 0,
  actionsMissingDescription: [],
  actionsMissingPropsDescription: [],
};

console.log('📦 DIMO Piece Overview');
console.log('-'.repeat(80));
console.log(`Display Name: ${report.displayName}`);
console.log(`Description: ${report.description}`);
console.log('');

// Scan action files
const actionsPath = path.join(dimoSrcPath, 'lib/actions');
const actionCategories = fs.readdirSync(actionsPath).filter((item) => {
  const itemPath = path.join(actionsPath, item);
  return fs.statSync(itemPath).isDirectory();
});

console.log('🔧 Analyzing Actions MCP Metadata');
console.log('-'.repeat(80));
console.log(`Found ${actionCategories.length} action categories\n`);

actionCategories.forEach((category) => {
  const actionFilePath = path.join(actionsPath, category, 'action.ts');
  const actionsFilePath = path.join(actionsPath, category, 'actions.ts');
  
  let filePath = actionFilePath;
  if (!fs.existsSync(actionFilePath) && fs.existsSync(actionsFilePath)) {
    filePath = actionsFilePath;
  }
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  No action file found for category: ${category}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract actions using regex
  const actionRegex = /createAction\s*\(\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}\s*\)/gs;
  const matches = [...content.matchAll(actionRegex)];
  
  if (!report.actionCategories[category]) {
    report.actionCategories[category] = [];
  }
  
  matches.forEach((match) => {
    const actionBlock = match[1];
    
    // Extract metadata
    const nameMatch = actionBlock.match(/name:\s*['"]([^'"]+)['"]/);
    const displayNameMatch = actionBlock.match(/displayName:\s*['"]([^'"]+)['"]/);
    const descriptionMatch = actionBlock.match(/description:\s*['"]([^'"]+)['"]/);
    
    const actionName = nameMatch ? nameMatch[1] : 'UNNAMED';
    const displayName = displayNameMatch ? displayNameMatch[1] : 'N/A';
    const description = descriptionMatch ? descriptionMatch[1] : null;
    
    report.totalActions++;
    
    const actionInfo = {
      name: actionName,
      displayName: displayName,
      hasDescription: !!description,
      description: description,
      propsCount: 0,
      propsWithDescription: 0,
    };
    
    // Count props
    const propsMatch = actionBlock.match(/props:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
    if (propsMatch) {
      const propsBlock = propsMatch[1];
      // Simple heuristic: count Property.* occurrences
      const propMatches = propsBlock.match(/Property\.\w+\s*\(/g);
      if (propMatches) {
        actionInfo.propsCount = propMatches.length;
        
        // Count props with description
        const propDescMatches = propsBlock.match(/description:\s*['"][^'"]+['"]/g);
        if (propDescMatches) {
          actionInfo.propsWithDescription = propDescMatches.length;
        }
      }
    }
    
    report.actionCategories[category].push(actionInfo);
    
    // Determine if action has full MCP support
    const hasFullMCP = actionInfo.hasDescription && 
                       (actionInfo.propsCount === 0 || actionInfo.propsWithDescription === actionInfo.propsCount);
    
    if (hasFullMCP) {
      report.actionsWithFullMCP++;
    }
    
    if (!actionInfo.hasDescription) {
      report.actionsMissingDescription.push(actionName);
    }
    
    if (actionInfo.propsWithDescription < actionInfo.propsCount) {
      report.actionsMissingPropsDescription.push(`${actionName} (${actionInfo.propsWithDescription}/${actionInfo.propsCount} props)`);
    }
    
    // Print action info
    console.log(`\n📄 ${displayName}`);
    console.log(`   Name: ${actionName}`);
    console.log(`   Category: ${category}`);
    console.log(`   Description: ${actionInfo.hasDescription ? '✅' : '❌'}`);
    if (description) {
      console.log(`   "${description.substring(0, 80)}${description.length > 80 ? '...' : ''}"`);
    }
    console.log(`   Props: ${actionInfo.propsCount} (${actionInfo.propsWithDescription} with descriptions)`);
    console.log(`   MCP Ready: ${hasFullMCP ? '✅ Yes' : '⚠️  Needs Work'}`);
  });
});

// Final Summary
console.log('\n\n📊 MCP Readiness Summary');
console.log('=' .repeat(80));
console.log(`Total Actions: ${report.totalActions}`);
console.log(`Actions with Full MCP Support: ${report.actionsWithFullMCP} (${Math.round((report.actionsWithFullMCP / report.totalActions) * 100)}%)`);
console.log(`Actions Missing Description: ${report.actionsMissingDescription.length}`);
console.log(`Actions with Props Missing Description: ${report.actionsMissingPropsDescription.length}`);
console.log('');

if (report.actionsMissingDescription.length > 0) {
  console.log('⚠️  Actions Missing Description:');
  report.actionsMissingDescription.forEach((name) => {
    console.log(`   - ${name}`);
  });
  console.log('');
}

if (report.actionsMissingPropsDescription.length > 0) {
  console.log('⚠️  Actions with Props Missing Description:');
  report.actionsMissingPropsDescription.forEach((name) => {
    console.log(`   - ${name}`);
  });
  console.log('');
}

// Action Categories Summary
console.log('📁 Action Categories:');
Object.keys(report.actionCategories).sort().forEach((category) => {
  const actions = report.actionCategories[category];
  console.log(`   ${category}: ${actions.length} action${actions.length !== 1 ? 's' : ''}`);
});
console.log('');

// Final Verdict
const mcpScore = Math.round((report.actionsWithFullMCP / report.totalActions) * 100);

console.log('🎯 Final Verdict');
console.log('-'.repeat(80));

if (mcpScore === 100) {
  console.log('✅ PERFECT! The DIMO piece has complete MCP support!');
  console.log('   All actions have descriptions and strongly-typed props.');
  console.log('   Ready for $200 MCP bounty submission! 🎉');
  console.log('');
  console.log('📝 Summary of Capabilities:');
  console.log(`   - ${report.totalActions} fully documented actions`);
  console.log(`   - ${Object.keys(report.actionCategories).length} API categories covered`);
  console.log('   - Comprehensive vehicle data access (telemetry, identity, events)');
  console.log('   - Vehicle valuation and instant offers');
  console.log('   - Webhook management for real-time vehicle events');
  console.log('   - Device definitions and VIN decoding');
  console.log('   - Token exchange and attestation');
  process.exit(0);
} else if (mcpScore >= 90) {
  console.log('⚠️  GOOD: The DIMO piece has strong MCP support.');
  console.log(`   MCP Score: ${mcpScore}%`);
  console.log('   Minor improvements recommended before bounty submission.');
  process.exit(0);
} else {
  console.log('❌ NEEDS WORK: The DIMO piece requires MCP improvements.');
  console.log(`   MCP Score: ${mcpScore}%`);
  console.log('   Please add descriptions to actions and props.');
  process.exit(1);
}
