# exit this file if we are not in Codespaces
if [ -z "${CODESPACES}" ]; then
  exit 0
fi

echo "Running Setup for Codespaces"

sh .devcontainer/codespaces.sh
