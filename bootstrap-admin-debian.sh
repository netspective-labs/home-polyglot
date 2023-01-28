#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# TODO: check if non-Debian (e.g. non-Ubuntu) based OS and stop; later we'll add ability for non-Debian distros

# get add-apt-repository command
sudo apt-get -qq update
sudo apt-get -y -qq install software-properties-common 

# we expect the latest Fish shell so be sure to use package archive provided by the fish project not older Debian packages
sudo add-apt-repository ppa:fish-shell/release-3

# get the latest packages meta data
sudo apt-get -qq update

# install true "essentials" that will be universally applicable
sudo apt-get -y -qq install fish curl git jq pass unzip bzip2 tree make bsdmainutils time gettext-base wget 

# install database clients for accessing remote databases
sudo apt-get -y -qq install postgresql-client default-mysql-client

# install "build essentials" that are needed to build local binaries (e.g. `asdf` uses it for SQLite package)
sudo apt-get -y -qq install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libsqlite3-dev libxml2-dev xz-utils tk-dev libxmlsec1-dev libreadline-dev libffi-dev libbz2-dev liblzma-dev llvm

# install common diagramming as code tools
sudo apt-get -y -qq install graphviz

# install latest osQuery using Debian package in bootstrap instead of chezmoi since it's not idempotent
OSQ_VERSION=`curl -fsSL https://api.github.com/repos/osquery/osquery/releases/latest | grep -oP '"tag_name": "\K(.*)(?=")'`
OSQ_APT_CACHE=/var/cache/apt/archives
OSQ_DEB_FILE=osquery_${OSQ_VERSION}-1.linux_amd64.deb
sudo curl -fsSL -o $OSQ_APT_CACHE/$OSQ_DEB_FILE https://pkg.osquery.io/deb/$OSQ_DEB_FILE
sudo dpkg -i $OSQ_APT_CACHE/$OSQ_DEB_FILE

# install git-extras in bootstrap instead of chezmoi since sudo is required for global setup
curl -fsSL https://git.io/git-extras-setup | sudo bash /dev/stdin

# install Jetpack devbox in bootstrap instead of chezmoi since sudo is required for global setup
curl -fsSL https://get.jetpack.io/devbox | FORCE=1 bash

# install latest asdf and direnv integration in bootstrap instead of chezmoi since installation is not idempotent
ASDF_DIR=$HOME/.asdf
ASDF_VERSION=`curl -fsSL https://api.github.com/repos/asdf-vm/asdf/tags | jq '.[0].name' -r` \
    bash -c 'git -c advice.detachedHead=false clone --quiet https://github.com/asdf-vm/asdf.git $HOME/.asdf --branch ${ASDF_VERSION}'
. $ASDF_DIR/asdf.sh
$ASDF_DIR/bin/asdf plugin-add direnv
PATH=$PATH:$ASDF_DIR/bin $ASDF_DIR/bin/asdf direnv setup --shell fish --version latest
PATH=$PATH:$ASDF_DIR/bin $ASDF_DIR/bin/asdf global direnv latest
mkdir -p ~/.config/fish/completions
ln -s $ASDF_DIR/completions/asdf.fish ~/.config/fish/completions

# use chezmoi.toml template and set it up so that subsequent chezmoi installation can use it
# TODO: switch to https://www.chezmoi.io/reference/special-files-and-directories/chezmoi-format-tmpl/
export CHEZMOI_CONF=~/.config/chezmoi/chezmoi.toml
mkdir -p `dirname $CHEZMOI_CONF`
curl -fsSL https://raw.githubusercontent.com/netspective-labs/home-polyglot/main/dot_config/chezmoi/chezmoi.toml.example > $CHEZMOI_CONF
chmod 0600 $CHEZMOI_CONF

echo "*****************************************************************************"
echo "** Netspective Labs Home (NLH) admin boostrap complete.                    **"
echo "** Installed:                                                              **"
echo "**   - fish                                                                **"
echo "**   - curl, git, gitextras, jq, pass, unzip, bzip2, tree, and make        **"
echo "**   - osquery (for endpoint observability)                                **"
echo "**   - asdf (version manager for languages, runtimes, etc.)                **"
echo "**   - direnv (per-directory environment variables loader, via asdf)       **"
echo "**   - devbox (nix-based predictable development environments)             **"
echo "** ----------------------------------------------------------------------- **"
echo "** Continue installation by editing chezmoi config:                        **"
echo '**   vi ~/.config/chezmoi/chezmoi.toml                                     **'
echo "*****************************************************************************"
