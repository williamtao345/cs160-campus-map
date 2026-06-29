# Contributing

## Workflow

- Create focused changes that solve one issue or task at a time.
- Keep commits small enough to review.
- Run relevant formatting, linting, and tests before opening a pull request.
- Update documentation when behavior, setup, or usage changes.

## Branches and Pull Requests

- Keep `main` stable and demoable; do not commit directly to it.
- Create short-lived branches from `main` named `type/scope-summary`, such as `feat/web-login`.
- Keep pull requests focused, describe what changed, and include screenshots for visible UI changes.
- Get at least one teammate review before merging, then delete the branch.

## Commits

- Use Conventional Commits: `type(scope): summary`.
- Example: `feat(web): add project dashboard`.
- Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- Use lowercase type and scope, and write the summary in imperative mood.
- Do not manually wrap commit messages; let the editor handle soft wrapping.
