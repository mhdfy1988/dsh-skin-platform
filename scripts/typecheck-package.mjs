import { runPackageBin } from './run-bin.mjs'

runPackageBin('typescript', ['-p', 'tsconfig.host.json', '--noEmit'])
runPackageBin('typescript', ['-p', 'tsconfig.client.json', '--noEmit'])
