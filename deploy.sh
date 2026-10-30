#!/bin/sh
set -e; cd "$(dirname "$0")"; rm -rf /tmp/ucus-pub; cp -r site /tmp/ucus-pub; cd /tmp/ucus-pub
git init -q -b gh-pages; git add -A; git -c user.name=alperunlu07 -c user.email=alperunlu07@users.noreply.github.com commit -qm deploy
git -c credential.helper='!gh auth git-credential' push -qf https://github.com/alperunlu07/ucus-kus.git gh-pages
