#!/usr/bin/env node
/*
 * Setup Firebase completo (seguro):
 * 1) Seed de dados
 * 2) Deploy de rules + indexes
 *
 * Uso:
 * node scripts/setup-firebase.js --serviceAccount ./serviceAccountKey.json [--projectId drak-feet-admin] [--overwrite]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function parseArgs(argv) {
  const args = { overwrite: false };
  for (let i = 2; i < argv.length; i += 1) {
    const part = argv[i];
    if (part === '--overwrite') {
      args.overwrite = true;
      continue;
    }
    if (part.startsWith('--serviceAccount=')) {
      args.serviceAccount = part.split('=')[1];
      continue;
    }
    if (part === '--serviceAccount') {
      args.serviceAccount = argv[i + 1];
      i += 1;
      continue;
    }
    if (part.startsWith('--projectId=')) {
      args.projectId = part.split('=')[1];
      continue;
    }
    if (part === '--projectId') {
      args.projectId = argv[i + 1];
      i += 1;
      continue;
    }
  }
  return args;
}

function runCommand(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  if (result.status !== 0) {
    throw new Error(`Falha ao executar: ${cmd} ${cmdArgs.join(' ')}`);
  }
}

function main() {
  const args = parseArgs(process.argv);

  if (!args.serviceAccount) {
    console.error('Informe --serviceAccount ./serviceAccountKey.json');
    process.exit(1);
  }

  const serviceAccountPath = path.resolve(process.cwd(), args.serviceAccount);
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Arquivo não encontrado: ${serviceAccountPath}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  const projectId = args.projectId || serviceAccount.project_id;

  if (!projectId) {
    console.error('Não foi possível determinar projectId. Use --projectId.');
    process.exit(1);
  }

  const seedArgs = ['scripts/seed-firestore.js', '--serviceAccount', args.serviceAccount, '--projectId', projectId];
  if (args.overwrite) {
    seedArgs.push('--overwrite');
  }

  console.log('\n[1/2] Executando seed de dados...');
  runCommand('node', seedArgs);

  console.log('\n[2/2] Publicando Firestore rules + indexes...');
  runCommand('npx', ['firebase', 'deploy', '--project', projectId, '--only', 'firestore:rules,firestore:indexes']);

  console.log('\nSetup concluído com sucesso.');
}

try {
  main();
} catch (error) {
  console.error('\nErro no setup:', error.message || error);
  process.exit(1);
}
