# This file is managed by chezmoi in {{ .chezmoi.sourceFile }}. DO NOT EDIT directly.
# To modify, use `chezmoi edit ~/.config/fish/conf.d/netspective-studios-home.fish --apply`. 

# NLH should used for all Netspective Studios Home (NLH) env-vars
export IS_NLH=1
export IS_NLH_WSL=0

set osVersion (cat /proc/version | string split0)
if string match -rq "(Microsoft|WSL)" $osVersion
    if string match -rq WSL2 $osVersion
        export IS_NLH_WSL=2
    else
        export IS_NLH_WSL=1
    end
end

# easier to understand name for eget (easier to use with fish auto-complete if you remember "github")
alias github-fetch-rel eget
alias reset-greeting "chezmoi state delete-bucket --bucket=fishGreeting"
