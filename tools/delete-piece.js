#!/usr/bin/env node
/**
 * Script to delete a piece from the Activepieces database
 * Usage: node tools/delete-piece.js <piece-name>
 * Example: node tools/delete-piece.js @vqnguyen1/piece-fiserv-premier-account
 */

const { Client } = require('pg');
require('dotenv').config();

const pieceName = process.argv[2];

if (!pieceName) {
  console.error('❌ Error: Please provide a piece name');
  console.error('Usage: node tools/delete-piece.js <piece-name>');
  console.error('Example: node tools/delete-piece.js @vqnguyen1/piece-fiserv-premier-account');
  process.exit(1);
}

async function deletePiece() {
  const client = new Client({
    host: process.env.AP_POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.AP_POSTGRES_PORT || '5432'),
    database: process.env.AP_POSTGRES_DATABASE || 'activepieces',
    user: process.env.AP_POSTGRES_USERNAME || 'postgres',
    password: process.env.AP_POSTGRES_PASSWORD,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // First, find all versions of this piece
    console.log(`🔍 Looking for pieces matching: ${pieceName}`);
    const findQuery = 'SELECT id, name, version, "displayName", "pieceType", "packageType", "platformId", "projectId" FROM piece_metadata WHERE name = $1';
    const findResult = await client.query(findQuery, [pieceName]);

    if (findResult.rows.length === 0) {
      console.log(`⚠️  No pieces found with name: ${pieceName}`);
      console.log('\n📋 Listing all custom pieces in the database:');

      const allCustomQuery = 'SELECT name, version, "displayName", "pieceType" FROM piece_metadata WHERE "pieceType" = \'CUSTOM\' ORDER BY name';
      const allCustomResult = await client.query(allCustomQuery);

      if (allCustomResult.rows.length === 0) {
        console.log('   No custom pieces found');
      } else {
        allCustomResult.rows.forEach(row => {
          console.log(`   - ${row.name} (v${row.version}) - ${row.displayName}`);
        });
      }

      await client.end();
      process.exit(0);
    }

    console.log(`\n📦 Found ${findResult.rows.length} version(s) of this piece:\n`);
    findResult.rows.forEach(row => {
      console.log(`   ID: ${row.id}`);
      console.log(`   Name: ${row.name}`);
      console.log(`   Version: ${row.version}`);
      console.log(`   Display Name: ${row.displayName}`);
      console.log(`   Type: ${row.pieceType}`);
      console.log(`   Package Type: ${row.packageType}`);
      console.log(`   Platform ID: ${row.platformId || '(none)'}`);
      console.log(`   Project ID: ${row.projectId || '(none)'}`);
      console.log('   ---');
    });

    // Delete all versions
    console.log(`\n🗑️  Deleting ${findResult.rows.length} version(s)...`);
    const deleteQuery = 'DELETE FROM piece_metadata WHERE name = $1';
    const deleteResult = await client.query(deleteQuery, [pieceName]);

    console.log(`✅ Successfully deleted ${deleteResult.rowCount} record(s) for piece: ${pieceName}\n`);

    await client.end();
    console.log('🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);

    try {
      await client.end();
    } catch (endError) {
      // Ignore errors when closing connection
    }

    process.exit(1);
  }
}

deletePiece();
