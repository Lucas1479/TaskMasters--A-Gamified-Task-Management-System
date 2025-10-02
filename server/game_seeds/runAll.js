// One-click seeding orchestrator (Windows-friendly)
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

MONGODB_URI=mongodb+srv://new88394151:sWgPtbgtySQYgr4J@cluster0.diqa2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ordered list with dependencies considered
const scripts = [
  // Create test user (shared by some user-specific seeds)
  '../game_seeds/generateTestUser.js',
  'DungoenRelated/skill.js',           // seed skills
  'DungoenRelated/defaultSkill.js',    // seed character classes (need skills)
  'DungoenRelated/monsters.js',        // seed monsters
  'DungoenRelated/event.js',           // seed events
  'DungoenRelated/dungoen.js',         // seed dungeon (needs monsters/events)
  'DungoenRelated/seedItems.js',       // seed equipment/shop
  // Initialize test user's level and dungeon stats (bound to username "testuser")
  '../game_seeds/levelTest.js',
  'DungoenRelated/userDungeonStats.js',
];

function runNode(scriptPath) {
  return new Promise((resolve) => {
    const full = path.join(__dirname, scriptPath);
    console.log(`\n▶ Running: ${path.relative(process.cwd(), full)}`);
    const child = spawn(process.execPath, [full], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ Done: ${scriptPath}`);
        resolve({ script: scriptPath, success: true });
      } else {
        console.warn(`⚠️ Script failed (code=${code}): ${scriptPath}`);
        resolve({ script: scriptPath, success: false });
      }
    });
  });
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in environment.');
    process.exit(1);
  }

  const results = [];
  for (const s of scripts) {
    // run sequentially to respect dependencies
    // eslint-disable-next-line no-await-in-loop
    const r = await runNode(s);
    results.push(r);
    if (!r.success) {
      console.warn('Continuing despite error to finish remaining seeds...');
    }
  }

  const failed = results.filter(r => !r.success);
  if (failed.length) {
    console.log('\nFinished with some failures:');
    for (const f of failed) console.log(` - ${f.script}`);
    process.exit(2);
  }

  console.log('\n🎉 All seeds completed successfully.');
}

main().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});


