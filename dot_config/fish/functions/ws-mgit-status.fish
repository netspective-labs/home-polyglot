# This file is managed by chezmoi in {{ .chezmoi.sourceFile }}. DO NOT EDIT directly.
# To modify, use `chezmoi edit ~/.config/fish/functions/ws-mgit-status.fish --apply`. 

# if you're in an `mGit` workspace (like `$HOME/workspaces`), `cd` to the top-level of the workspace
# and find the status (up to date, need pull, etc.) of each Git repo in the directory, recursively.
function ws-mgit-status
    if set -q MANAGED_GIT_WORKSPACES_HOME
        cd $MANAGED_GIT_WORKSPACES_HOME
        git mgitstatus -d 0
    else
        echo "Unable to provide status of Git repos, MANAGED_GIT_WORKSPACES_HOME is not set."
        echo "If you're using a standard directory structure, use `cd \$HOME/workspaces` and try again."
    end
end
