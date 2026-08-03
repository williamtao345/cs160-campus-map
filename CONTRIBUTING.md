# Contributing

## Workflow

- Create focused changes that solve one issue or task at a time.
- Keep commits small enough to review.
- Run relevant formatting, linting, and tests before opening a pull request.
- Update documentation when behavior, setup, or usage changes.

## Pull Requests

- Keep pull requests focused, describe what changed, and include screenshots for visible UI changes.
- Do not push directly to `main`; open a pull request and get approval from `@williamtao345` before merging.
- `@williamtao345` is the only exception and may push directly to `main` or merge without another approval.
- Delete the branch after merging.

## Commits

- Limit each commit to one coherent feature, fix, refactor, data update, or documentation change.
- Split unrelated UI, behavior, data, and cleanup changes into separate commits, even when they belong to the same pull request.
- Keep each commit independently understandable and reviewable; do not include opportunistic cleanup in a feature commit.
- Use Conventional Commits: `type(scope): summary`.
- Example: `feat(web): add project dashboard`.
- Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- Use lowercase type and scope, and write the summary in imperative mood.
- Do not manually wrap commit messages; let the editor handle soft wrapping.
