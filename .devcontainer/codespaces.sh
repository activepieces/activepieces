echo "Running Setup for Codespaces"

type -p curl >/dev/null || sudo apt install curl -y
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
&& sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
&& sudo apt update \
&& sudo apt install gh -y

gh codespace ports visibility 3000:public -c $CODESPACE_NAME
gh codespace ports visibility 4200:public -c $CODESPACE_NAME
export BACKEND_URL=$(gh codespace ports -c $CODESPACE_NAME --json sourcePort,browseUrl | jq -r '.[] | select(.sourcePort == 3000) | .browseUrl')
sed -i "s|apiUrl: 'http://localhost:3000/v1'|apiUrl: '${BACKEND_URL}/v1'|g" /workspace/packages/ui/common/src/lib/environments/environment.ts
sed -i "s|AP_WEBHOOK_URL=\"http://localhost:3000\"|AP_WEBHOOK_URL=\"${BACKEND_URL}\"|g" /workspace/packages/server/api/.env