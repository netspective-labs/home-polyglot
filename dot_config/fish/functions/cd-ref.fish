# This file is managed by chezmoi in {{ .chezmoi.sourceFile }}. DO NOT EDIT directly.
# To modify, use `chezmoi edit ~/.config/fish/functions/cd-ref.fish --apply`. 

# cd to the directory that the symlink points to
function cd-ref
    cd (dirname (realpath --relative-to=. (readlink -f $1)))
end