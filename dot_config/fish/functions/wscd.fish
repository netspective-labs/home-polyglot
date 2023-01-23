# This file is managed by chezmoi in {{ .chezmoi.sourceFile }}. DO NOT EDIT directly.
# To modify, use `chezmoi edit ~/.config/fish/functions/wscd.fish --apply`. 

# if you're in an `mGit` workspace (like `$HOME/workspaces`), `cd` to the top-level of the workspace;
# this works because each workspace top-level directory sets the $MANAGED_GIT_WORKSPACES_HOME variable.
function wscd
    if set -q MANAGED_GIT_WORKSPACES_HOME
        cd $MANAGED_GIT_WORKSPACES_HOME
    else
        echo "Unable to CD to top of mGit Workspace, MANAGED_GIT_WORKSPACES_HOME is not set."
    end    
end
