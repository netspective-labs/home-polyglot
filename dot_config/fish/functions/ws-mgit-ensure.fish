# This file is managed by chezmoi in {{ .chezmoi.sourceFile }}. DO NOT EDIT directly.
# To modify, use `chezmoi edit ~/.config/fish/functions/ws-mgit-ensure.fish --apply`. 

# Either `git clone` or `git pull` a repo to ensure that it exists in the local file system.
# Creates subdirectories per the mGit workspaces structure.
function ws-mgit-ensure -a repo
    if set -q repo
        deno eval --ext=ts "import * as m from \"$HOME/lib/mgit.ts\"; await m.ensureRepo(await m.workspaceRepo('$repo'));"
    else
        echo "Usage: ws-mgit-ensure github.com/org/repo"
    end
end
