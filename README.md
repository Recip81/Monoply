# Monopoly · Online 3D Board Game

A multiplayer Monopoly-style game built with React, TypeScript, React Three Fiber, Socket.IO, Express, Zustand, and Tailwind CSS.

## Features

- 3D board with animated player pieces
- Real-time multiplayer rooms
- Turn-based gameplay
- Dice rolling, movement, buying, rent, and jail flow
- Server-side game state and room management

## Development

```bash
npm install
npm run dev
```

This starts:

- Vite client on `http://localhost:5173`
- Socket.IO server on `http://localhost:3001`

## Other scripts

```bash
npm run typecheck
npm run build
npm start
```

## Project structure

- `src/` — client UI and rendering
- `server/` — game logic and Socket.IO server
- `shared/` — shared types between client and server

## Notes

- Set `PORT` to override the default server port `3001`
- The app uses `/socket.io` proxying during development
