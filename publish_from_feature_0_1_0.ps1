$ErrorActionPreference = "Stop"
$branch = "feature/0.1.0-initial-monitor"

git switch $branch
git status
git add -A
git commit -m "feat(frontend): create private market cycle monitor"
git push -u origin $branch
