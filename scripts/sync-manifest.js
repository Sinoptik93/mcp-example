#!/usr/bin/env node

/**
 * Manifest Sync Script
 *
 * Автоматически синхронизирует секцию "tools" в manifest.json
 * на основе инструментов в директории server/tools/
 *
 * Usage: npm run sync:manifest
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOOLS_DIR = path.join(__dirname, '../server/tools');
const MANIFEST_PATH = path.join(__dirname, '../manifest.json');

async function loadToolsFromDirectory() {
  const tools = [];

  try {
    const files = await fs.readdir(TOOLS_DIR);
    const jsFiles = files.filter(f => f.endsWith('.js'));

    console.log(`Found ${jsFiles.length} tool files in ${TOOLS_DIR}`);

    for (const file of jsFiles) {
      try {
        const toolPath = path.join(TOOLS_DIR, file);
        const toolModule = await import(`file://${toolPath}`);
        const tool = toolModule.default;

        if (tool.name && tool.description) {
          tools.push({
            name: tool.name,
            description: tool.description
          });
          console.log(`  ✓ ${tool.name}`);
        } else {
          console.warn(`  ⚠ Skipped ${file}: missing name or description`);
        }
      } catch (error) {
        console.error(`  ✗ Error loading ${file}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error reading tools directory:', error.message);
    process.exit(1);
  }

  return tools;
}

async function updateManifest(tools) {
  try {
    // Читаем manifest.json
    const manifestContent = await fs.readFile(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Обновляем секцию tools
    manifest.tools = tools;

    // Записываем обратно с форматированием
    await fs.writeFile(
      MANIFEST_PATH,
      JSON.stringify(manifest, null, 2) + '\n',
      'utf-8'
    );

    console.log(`\n✓ manifest.json updated with ${tools.length} tools`);
  } catch (error) {
    console.error('Error updating manifest:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('Syncing manifest.json with tools directory...\n');

  const tools = await loadToolsFromDirectory();

  if (tools.length === 0) {
    console.warn('⚠ No tools found. manifest.json will have empty tools array.');
  }

  await updateManifest(tools);

  console.log('\nDone! Tools section in manifest.json is now up to date.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
