#!/bin/bash
set -uo pipefail

# -------------------------------------------------------------------------------------------------
# ** ALL COMMANDS IN THIS SCRIPT MUST BE IDEMPOTENT **
# -------------------------------------------------------------------------------------------------
# This file will be executed after dot_eget.toml.tmpl is changed/updated. 
# * Use relative paths to find binaries (e.g. ~/bin/xyz) and don't assume anything is in PATH
# * If you add/remove packages be sure to reflect it in `~/bin/nlh-doctor`.
# -------------------------------------------------------------------------------------------------
# If you want to force-run this script after you've updated configs:
#   chezmoi state delete-bucket --bucket=scriptState
#   chezmoi apply
# -------------------------------------------------------------------------------------------------

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

NLH_EGET_LOG=~/.nlh-intall-eget-packages.sh.log
touch $NLH_EGET_LOG
echo "--- `date` ---" >> $NLH_EGET_LOG
printf "Installing GitHub-fetchable packages (tail -f ~/.nlh-intall-eget-packages.sh.log)..."

# https://github.com/zyedidia/eget installs prebuilt binaries from GitHub
# - uses ~/.eget.toml configuration by default (use `chez edit .eget.toml`)
# - alias `github-fetch-rel` is defined in dot_config/fish/conf.d/netspective-labs-home.fish
curl -fsSL https://zyedidia.github.io/eget.sh | sh >> $NLH_EGET_LOG 2>&1
mv eget ~/bin

# download all packages defined in ~/.eget.toml
~/bin/eget --download-all --quiet >> $NLH_EGET_LOG 2>&1

# https://github.com/timbod7/adl (Algebraic Data Language) is framework for building cross language data models
# we do this outside of ~/.eget.toml because it has some special processing (we have to get binaries and libs and put them into separate locations)
~/bin/eget timbod7/adl >> $NLH_EGET_LOG 2>&1
~/bin/eget timbod7/adl --file "lib" --to=$HOME/.local/share/adl >> $NLH_EGET_LOG 2>&1

# git-query was installed by eget but we allow use through 'git query' instead of just 'gitql':
rm -f ~/bin/git-query
ln -s ~/bin/gitql ~/bin/git-query

echo "done."
printf "Inspect ${YELLOW}$NLH_EGET_LOG${NC}: ${RED}`grep error $NLH_EGET_LOG | wc -l`${NC} potential error messages\n"
