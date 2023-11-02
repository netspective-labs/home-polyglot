# This file is managed by chezmoi in {{ .chezmoi.sourceFile }}. DO NOT EDIT directly.
# To modify, use `chezmoi edit ~/.config/fish/conf.d/rust.fish --apply`. 

# Get the current rust version and directory used by asdf
set rust_info (asdf current rust)

if test -z "(asdf list rust)"
    # Rust is not installed via asdf
else
    set asdf_current_rust_version (asdf current rust | awk '{print $2}')
    set asdf_rust_bin_path "$HOME/.asdf/installs/rust/$asdf_current_rust_version/bin"

    if test -d "$asdf_rust_bin_path"
        fish_add_path $asdf_rust_bin_path
        echo "Added Rust $asdf_current_rust_version binaries to PATH: $asdf_rust_bin_path"
    else
        echo "The expected Rust directory does not exist: $asdf_rust_bin_path"
    end
end
