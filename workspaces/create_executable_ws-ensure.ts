#!/usr/bin/env -S deno run -A

// deno-fmt-ignore
import { colors as c, $, ensureRepo, workspaceContext, workspaceRepo } from "../lib/mgit.ts";

/**
 * Declarative (idempotent) managed Git (mGit) repo maintenance. When you want to work on a Git repo
 * in your workspace, add it to `const wsRepos` below and then run these commands:
 *
 *   cd $HOME/workspaces
 *   ./ws-ensure.ts
 *
 * You safely can run this script as many times a day as you want since it's idempotent.
 *
 * Related commands useful for `mGit` repos observability:
 *   - git mgitstatus -d 0              # provide `git status` on every Git repo (use `ws-mgit-status` for convenience)
 *   - git standup -sm 5 -d 3 -a "all"  # summarize commits across all authors and repos over the past 3 days (use `ws-mgit-changes` for convenience)
 *   - ws-mgit-inspect                  # find all `*.mgit.code-workspace` files and detect repos in .folder[].path properties
 */

const wsContext = workspaceContext();

/* add your managed Git (GitHub, GitLab, etc.) repos here*/
const wsRepos = [{
  repoUrlWithoutScheme: "github.com/resFactory/factory",
}, {
  repoUrlWithoutScheme: "github.com/shah/icalytics",
}];

for (const wsr of wsRepos) {
  await ensureRepo(await workspaceRepo(wsr.repoUrlWithoutScheme, wsContext), {
    ensureVscWsDepsFolders: true,
    // by default we require *.mgit.code-workspace ("strict" matcher) but you can use
    // relaxedVsCodeWsPathMatchers() or your own matchers in case you want others.
    // vsCodeWsPathMatchers: relaxedVsCodeWsPathMatchers(),
  });
}

const gitStates = await $`git mgitstatus -d 0`.lines();
console.log(
  `${c.dim(`All git repo states:`)}\n  - ${(gitStates).sort().join("\n  - ")}`,
);
