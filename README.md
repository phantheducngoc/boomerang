# Boomerang Arena

An original browser party game: tiny garden heroes, returning boomerangs, and a little friendly chaos.

## Run locally

Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Choose a character, set a nickname, then try solo practice or create a room.
Friends on the same network can open `http://YOUR_LAN_IP:3000` while the server runs and your firewall allows it.
`localhost` invite links only work on your own computer; use the LAN address when playing across computers.

## Play

- WASD or arrow keys: move.
- Mouse: aim. Tap left click for short range; hold up to 0.9 seconds for maximum range, then release to throw (130–420 arena units).
- Right click or F: strike in a forward arc within 78 units, including while your boomerang is away. Strikes have a 0.65-second cooldown and cannot pass through cover or hit a dashing player.
- Space: press to dash; release and press again after the cooldown, with brief invulnerability.
- One hit eliminates a player for the round. Last survivor earns a point; first to five wins.
- More charge increases launch speed and forward acceleration as well as range.
- Strike an incoming or returning enemy boomerang to deflect it in your strike direction. It slows, drops, and becomes harmless. Hold left click or Y to recall your grounded boomerang from a distance; cover blocks its return. Its owner automatically picks it up within 32 arena units when no cover blocks the path, allowing another throw; strikes remain available.
- Cover turns outgoing throws back. Returning boomerangs stop and drop on collision with cover. Grounded weapons require manual retrieval; they do not automatically return.
- Solo practice includes three bots. Private rooms support 2–6 human players.
- The room host starts matches and rematches. A disconnect returns remaining players to the lobby.
- Sound is optional; toggle it in the header.

## Online hosting

Run `npm start` on a host supporting a persistent Node process and WebSocket connections.
The server serves both the browser app and `/ws` on one port (`PORT`, default `3000`).
Use HTTPS with WebSocket forwarding for public hosting. `/health` is available for health checks.
One server instance owns its rooms in memory: restarting loses rooms, and multiple instances need a shared room-routing design.
This prototype has no accounts, public matchmaking, persistent stats, or automatic reconnect.
It has not been deployed publicly or load-tested. Its room codes are temporary invites, not account authentication.

## Architecture

- `shared/`: pure simulation, collision, combat, character configuration, and bot behavior.
- `server/`: static HTTP serving, input validation, WebSocket transport, and room lifecycle.
- `public/js/art/`: original procedural Canvas character and garden artwork.
- `public/js/`: presentation, input, audio, session orchestration, and client networking.
- `public/styles/`: responsive lobby and match UI.

The server runs online matches at 30 ticks per second and decides movement, hits, and scores.
Clients interpolate snapshots; full client prediction and reconciliation are future work for high-latency connections.
Solo practice uses the same simulation locally. Game rules have no rendering or network dependencies.
All project code files follow the 300-line limit and SOLID rules in `AGENTS.md`.

## Validation

```sh
npm run check
npm test
npx playwright install chromium
# With the game server running in another terminal:
npm run test:browser
```

Browser checks save screenshots under `artifacts/`. They cover practice, room creation and joining,
two-browser matches, host permissions, disconnect recovery, and a narrow-screen layout.
Combat browser checks also cover charge/release, F and right-click strikes, canceled charges, and remote strike updates.
The line checker deliberately counts all nonblank lines, including comments, as a stricter guardrail.

Networking implementation uses the official [ws documentation](https://github.com/websockets/ws).
All characters and arena artwork are original code-drawn assets. No Boomerang Fu artwork or branding is included.

## Gamepad option

Connect a standard-mapped controller by USB or Bluetooth, open the game on localhost or HTTPS, and press a controller button to expose it to the browser. Use the mouse to choose a room or start practice.

- Left stick: move and aim (analog speed with a drift dead zone).
- Right stick: aim; the last direction stays selected when released.
- Y (top face button): hold to charge or recall, release to throw.
- A (bottom face button) or R (RB/R1, right shoulder): press to dash; release and press again after the cooldown.
- X or B (left or right face button): strike. Keyboard E retrieves, while F/right-click always strikes.

Keyboard and mouse remain available. Controller disconnect, loss of focus, and round changes cancel pending charges. Release action buttons after reconnecting before pressing again. One controller controls the current player; this does not add local split-screen players. Nonstandard mappings are reported rather than guessed.

Mapping follows the [W3C standard gamepad layout](https://www.w3.org/TR/gamepad/). Hardware/browser combinations still need physical-device testing.
