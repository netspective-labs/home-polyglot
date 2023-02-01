# Managed Git (mGit) workspaces (repos) governance

## Governed directory structure

`mGit workspaces` are managed by either GitHub or cloud/on-premise GitLab or any other supplier which offers HTTPs based Git repository management. `mGit` strategy allows multiple (single) repos to act as a _monorepo_ with respect to retrieving and managing repositories using Visual Studio Code. While `mGit` does not, strictly, *require* VS Code, `mGit` commands/tasks use the VS Code `*.code-workspaces` file format (specifically the `folders` property) to define which paths will participate as an `mGit` _monorepo_.

A very specific, strictly enforced, convention is used to structure "managed" Git workspaces (repos) in the current directory where each Git manager (e.g. github.com or git.company.io) has a home path under workspaces and the repos from that server are placed in the exact same directory structure as they appear in the home server (e.g. github.com or git.company.io). For GitHub, there is only github.com/org/repo combination but for GitLab there can be unlimited depth like git.company.io/group1/subgroup1/repo.

```fish
❯ tree -d -L 4 (pwd)
└── workspaces
    ├── github.com
    │   ├── shah
    │   │   ├── uniform-resource
    │   └── netspective-labs
    │       └── home-polyglot
    └── gitlab.company.io
        └── gitlab-group-parent
            └── child
                └── grandchild
                    ├── repo1
                    └── repo2
```     

## Governed code-workspace files

All our `mGit` tasks use VS Code `*.code-workspace` files whose folders assume that the `*.code-workspace` file is in the current directory root. This allows Visual Studio Code users to set their folders for all Git managers relative to the current directory as the root. 

With this feature, VSC workspaces are all fully portable using relative directories and can easily mix repos from different Git managers (e.g. GitHub, GitLab) to form a kind of _monorepo_.

For example, to produce the structure shown above the following `my.code-workspace` can be used:

```json
{
  "folders": [
    {
      "path": "github.com/shah/vscode-team"
    },
    {
      "path": "github.com/shah/uniform-resource"
    },
    {
      "path": "gitlab.company.io/gitlab-group-parent/child/grandchild/repo1"
    },
    {
      "path": "gitlab.company.io/gitlab-group-parent/child/grandchild/repo2"
    }
  ],
  "settings": {
    "git.autofetch": true
  }
}
```

## Using managed Git workspaces _declaratively_ with _idempotency_

By default, `home-polyglot`'s `chezmoi` scripts creates `$HOME/workspaces`. You can declaratively, and idempotently, manage all your repos by updating `ws-ensure.ts` and then running:

```bash
cd $HOME/workspaces
./ws-ensure.ts
```

The file `ws-ensure.ts`  should be considered "personal" (machine-specific and unmanaged by `chezmoi`). Whenever you want to grab a new managed repo from GitHub, GitLab, etc. just edit `$HOME/workspaces/ws-ensure.ts` and follow the examples. You can also ask your colleagues for their `ws-ensure.ts` file examples as well. 

## Imperatively cloning individual mGit repo(s)

If you'd like to clone a specific repo using mGit structure, without using `ws-ensure`, use `deno eval`, supplying the repo in `m.workspaceRepo('github.com/shah/icalytics')`:

```bash
cd $HOME/workspaces
deno eval --ext=ts "import * as m from '../lib/mgit.ts'; await m.ensureRepo(await m.workspaceRepo('github.com/shah/icalytics'));"
```

## Navigating managed Git workspaces

The `wscd` function is available. As you clone repos and move around inside `$HOME/workspaces` you may want to easily come back to the top of the workspaces root. You can do that using the `wscd` function. For example:

```bash
# if you're in $HOME/workspaces/github.com/myorg/myrepo
wscd
# now you're in $HOME/workspaces
```

## Getting status of Git objects across multiple repos

The `ws-mgit-status` function is available. As you clone repos and move around inside `$HOME/workspaces` you may want to easily see all the Git statuses of each Git repo under the workspaces root (recursively). You can do that using the `ws-mgit-status` function. For example:

```bash
# if you're in $HOME/workspaces/github.com/myorg/myrepo
ws-mgit-status
```

`ws-mgit-status` is a simple wrapper function which conveniently calls `git mgitstatus -d 0`. If you'd like to see different behavior, see usage instructions in [github.com/fboender/multi-git-status](https://github.com/fboender/multi-git-status).

## Seeing recent changes across multiple Git repos

The `ws-mgit-changes` function is available. As you clone repos and move around inside `$HOME/workspaces` you may want to easily see all the most recent changes committed and pushed to each Git repo under the workspaces root (recursively). You can do that using the `ws-mgit-changes` function. For example:

```bash
# if you're in $HOME/workspaces/github.com/myorg/myrepo
ws-mgit-changes
```

`ws-mgit-changes` is a simple wrapper function which conveniently calls `git standup -sm 5 -d 7 -a all`. If you'd like to see different behavior, see usage instructions in [github.com/kamranahmedse/git-standup](https://github.com/kamranahmedse/git-standup).

## Semantic Versioning and Git Tagging

We use [Semantic Versioning](https://semver.org/) so be sure to learn and regularly use the [semtag](https://github.com/nico2sh/semtag) bash script. 

For example:

```bash
git commit -am "git commit message"
git-semtag final -v v0.5.0
# or 'git-semtag final' without version to auto-compute semver based on heuristics
git push
```
