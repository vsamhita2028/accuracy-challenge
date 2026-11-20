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

Edit the `bank` in `src/scenarios.js`. Each row contains a title, a brief, two supported statements, one unsupported statement, and an explanation. Make sure the brief explicitly supports both correct statements and that the unsupported statement goes beyond or contradicts it. Review additions with the event team. The game randomly draws three distinct scenarios from the 50 in the bank and shuffles the three statements for each one.

## Scoring and storage

Players have 90 seconds total for three questions. Each correct answer earns 100 points; incorrect and unanswered questions earn 0, for a maximum of 300. Players can go back and change answers before finishing. At timeout, selected answers count and unselected questions are unanswered. Higher scores rank first; faster completion times break ties. A timeout is recorded as 90 seconds. Participants may save one result per game using a display name of 1–24 characters.

Scores from the older one-question version remain stored but are excluded from the three-question leaderboard because the scoring formats differ. Scores are stored in IndexedDB on the current device and browser, not shared across devices or users. Clearing browser site data removes them; private browsing and browser storage restrictions may prevent persistence. No backend or account is used. If storage is unavailable, the game remains playable and reports the problem.
