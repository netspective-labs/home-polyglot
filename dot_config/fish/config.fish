# This file is managed by chezmoi in {{ .chezmoi.sourceFile }}. DO NOT EDIT directly.
# To modify, use `chezmoi edit ~/.config/fish/config.fish --apply`. 

# put Oh My Posh `omp.cache` and other cache files into this path
export XDG_CACHE_HOME=$HOME/.cache

# this is where we should keep our binaries
fish_add_path ~/bin

# use https://ohmyposh.dev/ prompt theme engine to configure prompt
oh-my-posh init fish --config ~/.config/oh-my-posh/netspective-typical.omp.json | source

source ~/.asdf/asdf.fish
direnv hook fish | source
zoxide init fish | source

# Start SSH agent and add keys if ~/.ssh/id_rsa exists
if status --is-login
    if test -f ~/.ssh/id_rsa
        eval (ssh-agent -c) > /dev/null
        if not ssh-add -l > /dev/null
            ssh-add ~/.ssh/id_rsa > /dev/null 2>&1
        end
    end
end
