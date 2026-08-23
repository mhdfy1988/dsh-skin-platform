import { runPackageBin } from './run-bin.mjs'

runPackageBin('typescript', ['-b', 'tsconfig.host.json', '--force'])
runPackageBin('tsdown', ['--config', 'tsdown.host.config.ts'])
runPackageBin('typescript', ['-b', 'tsconfig.client.json', '--force'])
runPackageBin('tsdown', ['--config', 'tsdown.client.config.ts'])
