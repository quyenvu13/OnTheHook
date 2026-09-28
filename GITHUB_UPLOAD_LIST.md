# GitHub upload list

Upload the contents of the OnTheHook folder, preserving these paths:

- api
- contracts
- docs
- public
- src
- tests
- tools
- .env.example
- .gitignore
- CHANGELOG.md
- LICENSE
- LOCKED_SPEC.md
- OUTCOMEOWED_KILLSET_CHECK.py
- PROJECT_DEPLOYMENT_EVIDENCE.md
- README.md
- RUNTIME_EVIDENCE.md
- SECURITY.md
- SOURCE_SHA256.txt
- SUBMISSION_NOTE.md
- TESTING.md
- TEST_PLAN.md
- index.html
- package-lock.json
- package.json
- requirements-dev.txt
- tsconfig.app.json
- tsconfig.json
- tsconfig.node.json
- vercel.json
- vite.config.ts

Create .github/workflows/ci.yml with GitHub’s Create new file action so the slash-separated path is preserved.

Do not upload node_modules, dist, Python cache folders, local environment files, screenshots containing unrelated account data, or any .git folder.
