# This file is managed by chezmoi in {{ .chezmoi.sourceFile }}. DO NOT EDIT directly.
# To modify, use `chezmoi edit ~/.config/fish/functions/ws-mgit-inspect.fish --apply`. 

# if you're in an `mGit` workspace (like `$HOME/workspaces`), `cd` to the top-level of the workspace
# and run inspections on `*.code-workspace` files across all Git repos recursively.
function ws-mgit-inspect
    if set -q MANAGED_GIT_WORKSPACES_HOME
        cd $MANAGED_GIT_WORKSPACES_HOME
        deno eval "import * as mg from \"$HOME/lib/mgit.ts\"; await mg.inspect(mg.workspaceContext());"
    else
        echo "Unable to inspect, MANAGED_GIT_WORKSPACES_HOME is not set."
        echo "If you're using a standard directory structure, use `cd \$HOME/workspaces` and try again."
    end
end
