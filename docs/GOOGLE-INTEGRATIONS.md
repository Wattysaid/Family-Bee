# Google integrations

## Scope

Family-Bee supports multiple Google accounts. Each account is represented as an independent connection, then its calendars and Google Tasks lists can be selected for the wall display.

The first browser implementation uses Google Identity Services and keeps access tokens in memory only. This is appropriate for a prototype or a manually refreshed household display. A durable Raspberry Pi installation should use a small local companion service for the OAuth callback, encrypted refresh-token storage and scheduled synchronisation.

## Supported Google data

| Family-Bee capability | Google service | Access model |
| --- | --- | --- |
| Calendar | Google Calendar API | Read-only calendar and event access |
| Tasks and chores | Google Tasks API | Read/write task access when enabled |
| Shopping list | Family-Bee local list | Optional mirror to a Google Tasks list |

Google's supported APIs expose Calendar and Tasks. The consumer Google Shopping List does not have a supported public API for this use case, so Family-Bee treats shopping as local-first and can optionally mirror it to a dedicated Google Tasks list. This keeps the display useful when the Pi is offline and avoids pretending that Merchant API is a household shopping-list API.

## Configure a live connection

1. Create a Google Cloud project.
2. Enable Google Calendar API and Google Tasks API.
3. Configure the OAuth consent screen.
4. Create a Web application OAuth client ID.
5. Add the Family-Bee origin to the authorised JavaScript origins, for example `http://localhost:8080`.
6. Copy `config.example.js` to `config.js` and set `googleClientId`.
7. Run Family-Bee from `http://localhost:8080`, not `file://`.

Do not add a client secret to this repository or to a browser file. The browser client ID is public configuration; a secret belongs only in the future local companion service.

## Multiple-account behaviour

- `select_account` is requested when adding a connection.
- Account email and profile name are used only to label the connection.
- Calendar and task-list counts are loaded independently per account.
- Removing an account removes its in-memory access token and source associations from the current session.
- The UI never merges credentials; it merges only the selected display data.

## Next implementation slice

The next backend slice should add:

1. `family-bee-server` on the Pi for OAuth callback handling.
2. Encrypted refresh-token storage protected by a local installation key.
3. Incremental sync using Calendar `syncToken` and Tasks list updates.
4. A local SQLite projection for offline display and conflict handling.
5. A dedicated `shopping` table with optional two-way Google Tasks mapping.

