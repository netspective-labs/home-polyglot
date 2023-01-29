#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

#-----------------------------------------------------------------------------
# Optimized Ubuntu admin (`sudo`) boostrap.
#-----------------------------------------------------------------------------

# we expect the latest Fish shell so be sure to use package archive provided by the fish project not older Debian packages;
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

# install git-extras in bootstrap instead of chezmoi since sudo is required for global setup;
# right now chezmoi `run_once_install-packages.sh.tmpl` doesn't require sudo but if it does later,
# move `git-extras` install into `run_once_install-packages.sh.tmpl` for convenience
curl -sSL https://raw.githubusercontent.com/tj/git-extras/master/install.sh | sudo bash /dev/stdin

# install latest osQuery using Debian package in bootstrap instead of chezmoi since it's Debian-specific
OSQ_VERSION=`curl -fsSL https://api.github.com/repos/osquery/osquery/releases/latest | grep -oP '"tag_name": "\K(.*)(?=")'`
OSQ_APT_CACHE=/var/cache/apt/archives
OSQ_DEB_FILE=osquery_${OSQ_VERSION}-1.linux_amd64.deb
sudo curl -fsSL -o $OSQ_APT_CACHE/$OSQ_DEB_FILE https://pkg.osquery.io/deb/$OSQ_DEB_FILE
sudo dpkg -i $OSQ_APT_CACHE/$OSQ_DEB_FILE

echo "Netspective Labs Home (NLH) admin Debian-typical boostrap complete. Installed:"
echo " - fish, curl, git, gitextras, jq, pass, unzip, bzip2, tree, and make"
echo " - osquery (for endpoint observability)"
echo ""
echo "Continue installation by installing non-admin (user) packages:"
echo "--------------------------------------------------------------"
echo ""
echo '$ curl -fsSL https://raw.githubusercontent.com/netspective-labs/home-polyglot/master/bootstrap-common.sh | bash'
