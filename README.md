# Memo’s AI Accuracy Challenge

A client-side React/Vite booth game. Requires Node.js 20.19+ or 22+.

## Run locally

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Run `npm test` for the game logic tests and `npm run build` for a production build. Use `npm run preview` to preview it.

## Deploy to GitHub Pages

Put the contents of this directory at the root of a GitHub repository and push to `main`. In the repository’s **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source. The included workflow builds and deploys on pushes to `main`, and can also be run manually. The Vite base is `./`, so the built assets work at the root or under a repository subpath. If this directory remains nested inside a larger repository, adjust the workflow working directories, cache dependency path, and artifact path accordingly.

## Edit scenarios

Edit `src/scenarios.js`. Each scenario has a unique `id`, a `title`, a `brief`, exactly three statements with unique IDs and text, a `correctAnswer` matching the unsupported statement’s ID, and an `explanation` grounded in the brief. Review the two supported statements and the unsupported one before the event. One scenario is selected randomly for each game; its statements are shuffled.

## Scoring and storage

A correct answer within 90 seconds earns 100 points; incorrect and unanswered games earn 0. Higher scores rank first, with faster completion times breaking ties. A timeout is recorded as 90 seconds. Participants may save one result per game using a display name of 1–24 characters. The volunteer control asks for confirmation before clearing all local scores.

Scores are stored in IndexedDB on the current device and browser, not shared across devices or users. Clearing browser site data removes them; private browsing and browser storage restrictions may prevent persistence. No backend or account is used. If storage is unavailable, the game remains playable and reports the problem.
