# This file is managed by chezmoi in {{ .chezmoi.sourceFile }}. DO NOT EDIT directly.
# To modify, use `chezmoi edit ~/.config/fish/functions/ws-mgit-changes.fish --apply`. 

# if you're in an `mGit` workspace (like `$HOME/workspaces`), `cd` to the top-level of the workspace
# and find the most recent changes of each Git repo in the directory, recursively.
function ws-mgit-changes
    if set -q MANAGED_GIT_WORKSPACES_HOME
        cd $MANAGED_GIT_WORKSPACES_HOME
        # summarize commits across all authors and repos over the past 3 days
        git standup -sm 5 -d 7 -a all
    else
        echo "Unable to provide changes in Git repos, MANAGED_GIT_WORKSPACES_HOME is not set."
        echo "If you're using a standard directory structure, use `cd \$HOME/workspaces` and try again."
    end
end
