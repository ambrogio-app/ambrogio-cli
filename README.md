<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/logo-dark.svg">
    <img src=".github/logo-light.svg" alt="Ambrogio" width="320">
  </picture>
</p>

# Ambrogio — terminal client

**Ambrogio** is an open source home assistant that you host yourself. This repository is its **terminal chat client**: a full-screen text interface for talking to an Ambrogio backend from any terminal.

| Repository | Role |
|---|---|
| [ambrogio-backend](https://github.com/ambrogio-app/ambrogio-backend) | Conversation server, agents, speech, storage, public protocol |
| **ambrogio-cli** (this one) | Terminal chat client |
| [ambrogio-satellite](https://github.com/ambrogio-app/ambrogio-satellite) | Voice satellite with wake word, microphone and speaker |

> Ambrogio is in early development. This client's interface is in English or Italian.

## How it works

```
┌─ Chats ───────────────┐┌─ Conversation ───────────────────────────┐
│ ▸ New chat            ││ you: what's on the shopping list?        │
│   Shopping list       ││ ambrogio: milk, eggs and bread…          │
│   Weekend plans       ││                                          │
│   …                   ││──────────────────────────────────────────│
│                       ││ > _                                      │
└───────────────────────┘└──────────────────────────────────────────┘
```

On the left you see your conversations; on the right, the open conversation and an input field. The backend stores every conversation, so a chat you start here can go on from a voice satellite, and the other way round.

```mermaid
flowchart LR
    U((You)) --> TUI[Terminal UI]
    TUI -- "GET /api/v1/conversations<br/>list and history" --> B[ambrogio-backend]
    TUI <-- "WebSocket /api/session<br/>ambrogio.v1 turns" --> B
```

- **Conversation list and history** come from the backend's HTTP API and load page by page.
- **Messages** travel over a WebSocket session that uses the `ambrogio.v1` protocol. The CLI opens the session when you send your first message. Answers stream in as the backend produces them.
- The client identifies itself to the backend as `cli-<hostname>` unless you set another ID.

## Dependencies

- Node.js 24 or later
- [pnpm](https://pnpm.io/) 12.11.2, the version in `packageManager` of `package.json`: `npm install --global pnpm@12.11.2`
- An interactive terminal of at least 70 × 14 characters
- A running [ambrogio-backend](https://github.com/ambrogio-app/ambrogio-backend) that this machine can reach
- Runtime library: [Terminal Kit](https://github.com/cronvel/terminal-kit). The client uses Node's built-in `WebSocket` and `fetch`

The client uses only the backend's public interfaces: the `ambrogio.v1` protocol and the HTTP API.

## Quick start

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start --server http://my-ambrogio:3000
```

You can also set the server with `AMBROGIO_URL`, and the client ID with `--client-id` or `AMBROGIO_CLIENT_ID`. There is no default server URL.

The interface language is `--language it|en` or `AMBROGIO_LANGUAGE`. Without them, the client follows the system locale (`LC_ALL`, `LC_MESSAGES`, `LANG`): Italian if it starts with `it`, English otherwise. Answers and backend messages are shown as the backend sends them.

| Key | Action |
|---|---|
| `Enter` | Send the message, or open the selected chat |
| `Tab` | Switch between the input field and the chat list |
| `Ctrl+N` | New chat |
| `Ctrl+R` | Refresh the list and the current chat |
| `Ctrl+L` | Load more chats |
| `Ctrl+Q` | Quit |

## Development

```bash
pnpm test               # protocol and UI tests against a local fake backend
pnpm test:backend       # end-to-end test against the ambrogio-backend checkout next to this one
pnpm verify             # every CI check in order: model checks, frozen install, dependency audit, backend build, typecheck, tests, build
```

CI activates pnpm with Corepack at the version in `packageManager` and fails on high or critical advisories reported by `pnpm audit`.

`pnpm test:backend` expects a built checkout of `ambrogio-backend` at `../ambrogio-backend` or at the path in `AMBROGIO_BACKEND_REPO`. It runs the backend in the same process. It also needs a PostgreSQL test server, where the backend creates and drops its own database: run `../ambrogio-model/scripts/test-postgres start` (Docker required) and export the `AMBROGIO_TEST_DATABASE_URL=...` line it prints; `pnpm verify` needs it too.

Dependencies are pinned to exact versions in `package.json` and resolved in `pnpm-lock.yaml`. `pnpm-workspace.yaml` allows no dependency build scripts, and pnpm's default minimum release age for new versions stays on.

[gitleaks](https://github.com/gitleaks/gitleaks) 8.30.1 checks for secrets. CI scans the whole history on every push and pull request (`.github/workflows/secret-scan.yml`). `pnpm test` also tests the pre-commit hook and the CI scan command in temporary Git repositories, so it needs `gitleaks` on `PATH`; the CI checks job installs it. Locally, enable the versioned pre-commit hook once per clone; it needs `gitleaks` on `PATH` and blocks commits that add a secret. After the secret scan it runs the model checks of the workspace from the `ambrogio-model` checkout next to this repository, and blocks the commit if that checkout is missing:

```bash
git config core.hooksPath .githooks
```

Ambrogio is developed model first with [Reqvire](https://reqvire.org/). Its model is one, spread over [ambrogio-model](https://github.com/ambrogio-app/ambrogio-model) and the product repositories checked out side by side in one workspace folder: [`system-model/`](system-model/) holds the client's own requirements, contracts, verifications and technical decisions, linked directly to the shared decisions in `ambrogio-model` and to the backend contracts for the public protocol and HTTP API. [`AGENTS.md`](AGENTS.md) describes the workflow.

## License

[MIT](LICENSE)
