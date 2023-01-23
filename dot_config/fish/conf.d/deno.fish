# This file is managed by chezmoi in {{ .chezmoi.sourceFile }}. DO NOT EDIT directly.
# To modify, use `chezmoi edit ~/.config/fish/conf.d/deno.fish --apply`. 

# Deno is installed via chezmoi one-time install
export DENO_INSTALL="/home/snshah/.deno"
fish_add_path "$DENO_INSTALL/bin"

# Destination for all 'deno install X' "binaries". Deno appends "/bin".
export DENO_INSTALL_ROOT=~

alias deno-run="deno run -A --unstable"
alias deno-lint="deno lint --unstable"
alias deno-test="deno test -A --unstable"
alias deno-testc="deno test -A --unstable --coverage"
alias deno-clear-caches="rm -rf (deno --unstable info --json | jq -r .denoDir)"
alias deno-task='deno run --unstable -A (git rev-parse --show-toplevel)/Taskfile.ts'

# repo-task runs Taskfile.ts at the Git repo's home directory (same as legacy deno-task alias)
alias repo-task='deno run --unstable -A (git rev-parse --show-toplevel)/Taskfile.ts'

# path-task runs Taskfile.ts at the current path, parent path, or ancestor paths (whichever comes first)
# TODO: rewrite for fish
#alias path-task=$'deno run --unstable -A $(/bin/bash -c \'file=Taskfile.ts; path=$(pwd); while [[ "$path" != "" && ! -e "$path/$file" ]]; do path=${path%/*}; done; echo "$path/$file"\')'

# cwd-task runs Taskfile.ts at the current working directory only
alias cwd-task='deno run --unstable -A ./Taskfile.ts'
