# Huly.io MCP Piece

A comprehensive Model Context Protocol (MCP) integration for Huly.io - an internal project and document management platform.

## Setup Requirements

### GitHub Token for Dependencies

This piece requires `@hcengineering` packages from GitHub Package Registry. You need a GitHub Personal Access Token with `read:packages` scope.

**For Development:**
```bash
export GITHUB_TOKEN="your_github_token_here"
```

**For Production/CI:**
Set `GITHUB_TOKEN` environment variable in your deployment.


## 🔧 Setup Requirements

### GitHub Token for Dependencies

This piece requires `@hcengineering` packages from GitHub Package Registry. You need:
```bash
# Create a GitHub Personal Access Token with 'read:packages' scope
# Add to your environment or .env file:
export GITHUB_TOKEN="your_github_token_here"
```

**For Production/CI:**
- Set `GITHUB_TOKEN` environment variable in your deployment
- Ensure the token has `read:packages` scope
- The token is already configured in `.npmrc` for package installation
