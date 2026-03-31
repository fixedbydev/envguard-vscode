# EnvGuard for VS Code

Validate environment variables against your Zod schema directly in VS Code.

## Features

- **Problem Panel Diagnostics** — undeclared `process.env.KEY` usages show as errors, dynamic access as warnings
- **Status Bar** — shows current env health at a glance, click to run doctor
- **Commands** — run doctor, sync .env.example, open dashboard from the command palette

## Commands

| Command | Description |
| --- | --- |
| `EnvGuard: Run Doctor` | Run health check in terminal |
| `EnvGuard: Sync .env.example` | Show diff between .env and .env.example |
| `EnvGuard: Show Dashboard` | Start web dashboard and open in browser |

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `envguard.schemaPath` | `./env.schema.ts` | Path to Zod schema file |
| `envguard.envPath` | `.env` | Path to .env file |
| `envguard.autoRun` | `true` | Run audit on file save |
| `envguard.maskValues` | `false` | Mask sensitive values in editor |

## How It Works

1. Reads your `env.schema.ts` to learn declared env keys
2. On file save, scans `.ts`/`.js` files for `process.env` accesses
3. Any key not in the schema shows as an error in the Problems panel
4. Dynamic `process.env[variable]` access shows as a warning
5. Status bar updates with current issue count

## Install

Search "EnvGuard" in the VS Code Extensions marketplace, or:

```bash
code --install-extension stacklance.envguard
```

## Requirements

- `@stacklance/envguard-cli` installed in your project for commands to work
- An `env.schema.ts` file with Zod schema declarations

## License

MIT
