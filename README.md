# Netspective Labs Polyglot Home Setup

This is our opinionated [chezmoi](https://www.chezmoi.io/)- and [asdf](https://asdf-vm.com/)-based "engineering sandbox home" setup for polyglot software development or any other "creator tasks" that are performed on Linux-like operating systems. 

If you're using Windows 10/11 with WSL2, create a "disposable" Linux instance using Powershell CLI or Windows Store. This project treats the WSL2 instance as "disposable" meaning it's for development only and can easily be destroyed and recreated whenever necessary. The cost for creation and destruction for a Engineering Sandbox should be so low that it should be treated almost as a container rather than a VM. This means everything done in a sandbox should be scripted, with the scripts stored in GitHub for easy re-running through Fish shell or `chezmoi`.

## Linux versions

Use `Kali Linux` *Rolling version* as our preferred distribution (see [kali-linux for WSL](https://apps.microsoft.com/store/detail/kali-linux/9PKR34TNCV07), freely available in the Windows Store for WSL2) or as VMs in Hyper-V. Any Debian-based distro which supports Fish Shell 3.6+ should also work, including Ubuntu 20.04 LTS, Ubuntu 22.04 LTS, Debian 11+ with Fish upgrades, etc.

If you're using Windows WSL, you can use these commands to install/uninstall our preferred distro:

```powershell
$ wsl --unregister kali-linux
$ wsl --install -d kali-linux
```

If you're using a Debian-based distro you should be able to run this repo in any Debian user account. It will probably work with any Linux-like OS but has only been tested on Debian-based distros (e.g. Kali Linux and Ubuntu 20.04 LTS).

## One-time setup

Bootstrap our preferred Kali environment with required utilities (be sure to use `bootstrap-admin-debian-typical.sh` if you're not using Kali):

```bash
cd $HOME && sudo apt-get -qq update && sudo apt-get install curl -y -qq && \
   sudo apt-get -qq update && sudo apt-get -qq install -y lsb-release && \
   curl -fsSL https://raw.githubusercontent.com/netspective-labs/home-polyglot/master/bootstrap-admin-kali.sh | bash
```

Once the admin (`sudo`) part of the boostrap is complete, continue with non-admin:

```bash
curl -fsSL https://raw.githubusercontent.com/netspective-labs/home-polyglot/master/bootstrap-common.sh | bash
```

We use [chezmoi](https://www.chezmoi.io/) with templates to manage our dotfiles across multiple diverse machines, securely. The `bootstrap-*` script has already created the `chezmoi` config file which you should personalize _before installing_ `chezmoi`. See [chezmoi.toml Example](dot_config/chezmoi/chezmoi.toml.example) to help understand the variables that can be set and used across chezmoi templates.

```bash
vim.tiny ~/.config/chezmoi/chezmoi.toml
```

Install `chezmoi` and generate configuration files based on values in Netspective Labs Home `chezmoi` templates:

```bash
sh -c "$(curl -fsSL git.io/chezmoi)" -- init --apply netspective-labs/home-polyglot
```

We prefer `Fish` as the default shell and `Oh My Posh` as the CLI prompts theme manager. These are configured automatically by `chezmoi`'s first-time configuration. You should switch your user's default shell to `Fish` by running:

```bash
chsh -s /usr/bin/fish
exit
```

At this point the default configuration should be complete and you can start using your NLH workspaces.

## Secrets Management

* Generate [GitHub personal access tokens](https://github.com/settings/tokens) and update `$HOME/.config/chezmoi/chezmoi.toml` file (this file is created at installation and is private to the user). Then, run `chez apply` to regenerate all configuration files that use the global `chezmoi.toml` file.
* `$HOME/.pgpass` should follow [PostgreSQL .pgpass](https://tableplus.com/blog/2019/09/how-to-use-pgpass-in-postgresql.html) rules for password management.

## Maintenance

Regularly run, or when `github.com/netspective-labs/home-polyglot` repo is updated:

```bash
chez upgrade
chez update
```

<mark>** DO NOT EDIT ** chezmoi-managed files. To see which files are managed by chezmoi run _chezmoi managed_ and edit those using guidance in the _Contributing_ section below.</mark>

### Running chezmoi-managed scripts manually

There are a few chezmoi-managed scripts that are automatically run when necessary:

* `run_once_dot_eget.toml.sh.tmpl`
* `run_once_install-packages.sh.tmpl`

These and other "managed" scripts show up like this:

```bash
$ chezmoi managed | grep '\.sh$'
.eget.toml.sh
install-packages.sh
```

If you ever need to run them manually, you would use:

```bash
chezmoi cat .eget.toml.sh | bash
chezmoi cat install-packages.sh | bash
```

### Contributing to `home-polyglot` project

To see which files are _managed_ by `chezmoi` run `chezmoi managed`. Never edit any managed without using `chez edit` or opening the files in the `chezmoi` source directory. Use `chez edit <managed-file> --apply` like `chez edit ~/.config/fish/config.fish --apply` when you want to make quick edits to individual files and apply the changes immediately.

An easier way to modify these file is to use VS Code to edit and manage `chezmoi` templates and configurations using the `chez-code` alias, which is basically the same as running `chezmoi cd` and then opening VS Code.

Be sure to follow the [chezmoi workflows for editing configuration files](https://www.chezmoi.io/user-guide/command-overview/#daily-commands) and use `chezmoi apply` locally to do your testing.

Whenver possible, create `chezmoi` _templates_ that generate configs (especially when secrets are involved, like in `.gitconfig`).

PRs are welcome. If you're making changes directly (without a PR), after updating and before pushing code, tag the release:

```bash
chezmoi cd
# <git commit ...>
git-semtag final && git push
# or git-semtag final -v "vN.N.N" && git push
```

#### Community dotfiles projects to learn from

Study these [chezmoi-tagged repos](https://github.com/topics/chezmoi?o=desc&s=stars):

* https://github.com/twpayne/dotfiles
* https://github.com/felipecrs/dotfiles
* https://github.com/renemarc/dotfiles

They will have good ideas about how to properly create fully configurable `home` directories across all of our polyglot engineering stations.

#### Documenting `home-polyglot` project

A project is only as useful as its documentation so if you contribute to or modify code in this repo be sure to document it using this priority:

* Follow guidance and conventions for Fish (e.g. use `~/.config/fish/*` locations), `asdf`, `direnv`, etc. so that developers can easily understand your work
* Add comments to scripts that explain not just what is being done but, more importantly, _why_
* Whenever possible, explain concepts through visualizations using Draw.io (or D2/PlantUML/[diagram-as-code](https://text-to-diagram.com/) utilities).
  * Instead of Visio or any other desktop-based tools please use the [hediet.vscode-drawio](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio) VS code extension's `*.drawio.svg` and `*.drawio.png` capabilities. This allows you to edit the Draw.io files visually but an `.svg` or `.png` is automatically created for the repo (which can then be referenced/linked in Markdown like README.me).  

## GitHub Binary Releases Management

We use [eget](https://github.com/zyedidia/eget) to install prebuilt binaries from GitHub. `eget` works great when all we care about is the latest version of a single binary from a particular GitHub repo. In case we care about versioning per-project / per-directory then we should switch to `asdf`, `nix`, etc.

## Polyglot Languages Installation and Version Management

We use `asdf` to manage languages and utilities when deterministic reproducibility is not crucial. `asdf` enables tools to be installed and, more importantly, support multiple versions simultaneously. For example, we heavily use `Deno` for multiple projects but each project might require a different version. `asdf` supports global, per session, and per project (directory) [version configuration strategy](https://asdf-vm.com/#/core-configuration?id=tool-versions).

`asdf` has [centrally managed plugins](https://asdf-vm.com/#/plugins-all) for many languages and runtimes and there are even more [contributed plugins](https://github.com/search?q=asdf) for additional languages and runtimes. 

There are good [asdf videos](https://www.youtube.com/watch?v=r6qLQgq2vGk) worth watching.

In addition to `asdf` which supports a flexible [version configuration strategy](https://asdf-vm.com/#/core-configuration?id=tool-versions) for languages and runtimes, we use [direnv](https://asdf-vm.com/) to encourage usage of environment variables with per-directory flexibility. Per their documentation:

> direnv is an extension for your shell. It augments existing shells with a new feature that can load and unload environment variables depending on the current directory.

We use `direnv` and `.envrc` files to manage environments on a [per-directory](https://www.tecmint.com/direnv-manage-environment-variables-in-linux/) (per-project and descendant directories) basis. `direnv` can be used to [manage secrets](https://www.youtube.com/watch?v=x3p-28PajJY) as well as non-secret configurations. Many other [development automation techniques](http://www.futurile.net/2016/02/03/automating-environment-setup-with-direnv/) are possible.

There are some [direnv YouTube videos](https://www.youtube.com/results?search_query=direnv) worth watching to get familar with the capabilities.

### Use asdf for simple isolation

You can install languages and other packages like this:

```bash
asdf plugin add golang
asdf plugin add nodejs

asdf install golang latest
asdf install nodejs latest

asdf global golang latest
asdf global nodejs latest
...

asdf current
```

Or, use the convenience tasks in `~/bin`:

```bash
asdf-setup-plugin java          # Install the plugin and its latest stable version but don't set the version
asdf-setup-plugin julia
...
asdf-setup-plugin-global hugo   # Install the named plugin, its latest stable release, and then set it as the global version
asdf-setup-plugin-global python
asdf-setup-plugin-global haxe
asdf-setup-plugin-global neko
...
asdf current
```

#### Use `asdf install` with `.tool-versions` to auto-install

Per [asdf .tool-versions documentation](https://asdf-vm.com/#/core-configuration):

> To install all the tools defined in a `.tool-versions` file run asdf install with no other arguments in the directory containing the `.tool-versions` file.

> To install a single tool defined in a `.tool-versions` file run asdf install <name> in the directory containing the `.tool-versions` file. The tool will be installed at the version specified in the `.tool-versions` file.

> Edit the file directly or use `asdf local` (or `asdf global`) which updates it.

This might better than trying to give installation instructions in `README.md` and other per-project files.

Basically in each of our Git repos we can give `.tool-versions` and then each project user can just run `asdf install`.

### Conventions

* We use `$HOME/bin` for binaries whenever possible instead globally installing them using `sudo`.
* We use `direnv` and per-directory `.envrc` to help manage secrets and env-based configurations per-project rather than globally.

### Packages

Run `nlh-doctor` to get list of useful packages and versions included. Some highlights:

* We use [fish shell](https://fishshell.com/) for our CLI.
* We use `git` and `git-extras` and define many `git-*` individual scripts (e.g. `mGit`) because we're a GitOps shop.
* We use [asdf](https://asdf-vm.com/) for basic tools isolation.
* We use [deno](https://deno.land) for custom scripting and `dax` command runner to execute tasks (available in `$HOME/bin`). We favor `deno` over `make` for new packages but `make` is still a great tool for legacy requirements. If we create complex scripts that need to perform shell manipulation, `deno` with [dax](https://github.com/dsherret/dax) is preferred over making system calls in `deno`.
* We use [pass](https://www.passwordstore.org/) the standard unix password manager for managing secrets that should not be in plaintext.
* We use `osQuery`, `cnquery`, `steampipe`, et. al. system and endpoint observabilty tools for SOC2 and other compliance requirements

#### Data Engineering

Default data tools installed in `~/bin`:

* [Miller](https://github.com/johnkerl/miller) is like awk, sed, cut, join, and sort for name\-indexed data such as CSV, TSV, and tabular JSON.
* [daff](https://github.com/paulfitz/daff) library for comparing tables, producing a summary of their differences.
* [csvtk](https://github.com/shenwei356/csvtk) is a cross-platform, efficient and practical CSV/TSV toolkit in Golang.
* [xsv](https://github.com/BurntSushi/xsv) is a fast CSV command line toolkit written in Rust.
* [OctoSQL](https://github.com/cube2222/octosql) is a query tool that allows you to join, analyse and transform data from multiple databases and file formats using SQL.
* [q](http://harelba.github.io/q/) - Run SQL directly on CSV or TSV files.
* [Dasel](https://github.com/TomWright/dasel) jq/yq for JSON, YAML, TOML, XML and CSV with zero runtime dependencies.

#### Beneficial Add-ons

##### gitui terminal-ui for Git

[GitUI](https://github.com/extrawurst/gitui) provides you with the comfort of a git GUI but right in your terminal. Per their website, "this tool does not fully substitute the `git` CLI, however both tools work well in tandem". It can be installed using:

```bash
asdf-setup-plugin-global gitui https://github.com/looztra/asdf-gitui
```

### Environment Variables

* `XDG_CACHE_HOME` (defined in `dot_config/fish/config.fish`)
* `IS_NLH` and `IS_NLH_WSL` (defined in `dot_config/fish/conf.d/netspective-labs-home.fish`)
* `DENO_INSTALL` (defined in `dot_config/fish/conf.d/deno.fish`)
* `MANAGED_GIT_WORKSPACES_HOME` (defined in `direnv` `.envrc` for `mGit` workspaces)

### PATH

* `$HOME/bin` (defined in `dot_config/fish/config.fish`)
* `$HOME/.deno/bin` (defined in `dot_config/conf.d/deno.fish`)

### Aliases

* `chez`: an abbreviation for `chezmoi`, use it like `chez apply` (defined in `dot_config/fish/conf.d/chezmoi.fish`)
* `chez-code`: launch Visual Studio Code with $`chezmoi source-path`/home.code-workspace (defined in `dot_config/fish/conf.d/chezmoi.fish`)
* `cdchez`: `cd` to `chezmoi source-path` without starting a new shell; `chez cd` would do the same but start a new shell (defined in `dot_config/fish/conf.d/chezmoi.fish`)

### Functions

* `wscd`: if you're in an `mGit` workspace (like `$HOME/workspaces`), `cd` to the top-level of the workspace (defined in `dot_config/fish/functions`)

# Troubleshooting / FAQ

* Why do I see `jq: error (at <stdin>:1): Cannot index object with number` at the CLI sometimes?
  * We use the GitHub API to get the latest versions of repos. For example `curl -s https://api.github.com/repos/asdf-vm/asdf/tags | jq '.[0].name' -r` returns the latest version of the ASDF library. When GitHub reaches its limit the `https://api.github.com/repos/asdf-vm/asdf/tags` URL will return `503 Forbidden` and then `jq` will fail. The message `jq: error (at <stdin>:1): Cannot index object with number` fools us into thinking the issue is with `jq` but the issues is that GitHub reached the API rate limit per hour.

## Managed Git Repos (GitHub, GitLab, etc.) Tools

Please review the bundled [Managed Git](workspaces/README.md) and opinionated set of instructions and tools for managing code workspaces that depend on multiple repositories.

We use [Semantic Versioning](https://semver.org/) so be sure to learn and regularly use the [semtag](https://github.com/nico2sh/semtag) bash script that is installed as `git-semtag` in `$HOME/bin`. 

For example:

```bash
chez cd
# perform regular git commits
git chglog --output CHANGELOG.md && git commit -m "auto-generate CHANGELOG.md" CHANGELOG.md
git semtag final
# or 'git semtag final -v "v0.5.0"' for specific version
git push
```

## Important per-project and per-directory configuration management tools

We use `direnv` to encourage usage of environment variables with per-directory flexibility. Per their documentation:

> direnv is an extension for your shell. It augments existing shells with a new feature that can load and unload environment variables depending on the current directory.

We use `direnv` and `.envrc` files to manage environments on a [per-directory](https://www.tecmint.com/direnv-manage-environment-variables-in-linux/) (per-project and descendant directories) basis. `direnv` can be used to [manage secrets](https://www.youtube.com/watch?v=x3p-28PajJY) as well as non-secret configurations. Many other [development automation techniques](http://www.futurile.net/2016/02/03/automating-environment-setup-with-direnv/) are possible.

There are some [direnv YouTube videos](https://www.youtube.com/results?search_query=direnv) worth watching to get familar with the capabilities.

# Guidance and education

* Use [Single\-file scripts that download their dependencies](https://dbohdan.com/scripts-with-dependencies) as a guide for learning how to create portable scripts (especially [Anything with a Nix package](https://dbohdan.com/scripts-with-dependencies#anything-with-a-nix-package)).

# TODO (Roadmap)

## Create CLI completions for `psql` and other commands

`netspective-labs/postgres/pgpass.ts` has a TODO which suggests [martin1keogh/zsh_pgpass_completion](https://github.com/martin1keogh/zsh_pgpass_completion)-like CLI completions. Once that's done incorporate the generated completions into `home-polyglot`.

## Evaluate `tea` as a replacement for `asdf` and `direnv` for basic isolation

[tea](https://github.com/teaxyz/cli) claims to be _the next generation, cross‐platform package manager_ replacing `brew`, `winget`, etc. At our convenience (and as `tea` matures) we should evaluate whether it's the right next package manager for us.

## Evaluate Jetpack devbox if we don't end up using `tea` or `asdf` is not enough

We should consider [devbox](https://jetpack.io/devbox) as our nix-based project-specific package manager to install languages and utilities which require more complex package management than what `asdf` can handle. [jetpack.io devbox](https://www.jetpack.io/devbox) should be evaluated after `tea` because it uses `nix` and supports generating IaC artifacts like Dockerfile.

### Install nix-shell as part of bootstrap

As we start to use more `nix` capabilities, consider installing `nix-shell` as part of `bootstrap-admin-*.sh`. Since `devbox` and other home managers depend on Nix anyway, it probably makes sense to manage `nix` core separately from `devbox`, et. al.

## Add support for GitHub Workspaces (and other cloud IDEs)

Define how `mGit` and other typical `home-polyglot` should work for GitHub Workspaces. For example, the default directory for projects is `/workspaces` instead of `$HOME/workspaces`. How should we support GitLab IDE?

## Install Fisher package manager, equivalent to Antigen and others for ZSH

```bash
fish
curl -sL https://git.io/fisher | source && fisher install jorgebucaran/fisher
```

Install `tide` _the ultimate Fish prompt_, equivalent to Powerlevel10k for ZSH, in case `tide` is more favorable to our default `Oh My Posh` cross-shell prompt theming engine.

```bash
fisher install IlanCosman/tide
```

## Use `.netrc` and -n with `curl` commands

See [Do you use curl? Stop using -u. Please use curl -n and .netrc](https://community.apigee.com/articles/39911/do-you-use-curl-stop-using-u-please-use-curl-n-and.html). We should update all references to `curl` to include `curl -n` so that `.netrc` is optionally pulled in when we need to use the following configuration:

```
machine api.github.com
  login gitHubUserName
  password gh-personal-access-token
```

When we run into problems of API rate limiting with anonymous use of `api.github.com` then users can easily switch to authenticated use of `api.github.com` which will increase rate limits.

## Install optional packages via chezmoi

Use [run_once_install-packages.sh.tmpl](run_once_install-packages.sh.tmpl) in case we need to install some defaults. See:

```bash
chezmoi execute-template '{{ .chezmoi.osRelease.id }}'      # e.g. debian or ubuntu
chezmoi execute-template '{{ .chezmoi.osRelease.idLike }}'  # e.g. debian if running ubuntu
```

If a release is Debian or Debian-like (e.g. Ubuntu and others) we should automatically install some packages through `chezmoi` [scripts to perform actions](https://www.chezmoi.io/docs/how-to/#use-scripts-to-perform-actions). This might be a better way to install `postgresql-client` and other database-specific functionality as well as other packages.

## File Management

* Integrate [Wildland](https://wildland.io/), a collection of protocols, conventions, and software, which creates a union file system across S3, WebDAV, K8s, and other storage providers.

## Evaluate pueue to processes a queue of shell commands

[Pueue](https://github.com/Nukesor/pueue) is a command-line task management tool for sequential and parallel execution of long-running tasks. There is also `pueued` daemon, with runs processes runs in the background (no need to be logged in).
