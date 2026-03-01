# pieces-github

Developer platform that allows developers to create, store, manage and share their code.

## Description

The GitHub piece allows you to integrate your GitHub account with Activepieces. You can use it to automate various tasks such as creating issues, managing comments, and responding to repository events via triggers.

All GitHub actions and triggers are also available as **MCP (Model Context Protocol) tools**, enabling seamless integration with AI agents like Claude, Cursor, and Windsurf.

## Authentication

This piece uses **OAuth2** for authentication. When setting up the GitHub piece in Activepieces, you will be prompted to authorize access to your GitHub account.

The requested scopes include:
- `admin:repo_hook`: To manage repository webhooks for triggers.
- `admin:org`: To access organization-related data.
- `repo`: To access and manage your repositories, issues, and pull requests.

## Actions

- **Create Issue**: Create a new issue in a specific repository.
- **Update Issue**: Update an existing issue (title, description, state, labels, assignees).
- **Find Issue**: Find an issue using the GitHub Search API.
- **Get Issue Information**: Retrieve detailed information about a specific issue.
- **Create Comment on an Issue**: Add a comment to an issue or pull request.
- **Lock Issue**: Lock conversation on an issue.
- **Unlock Issue**: Unlock conversation on an issue.
- **Create Commit Comment**: Create a comment on a specific commit.
- **Create Pull Request Review Comment**: Create a review comment on a pull request.
- **Create Discussion Comment**: Create a comment on a GitHub discussion.
- **Raw GraphQL Query**: Perform a custom GraphQL query against the GitHub API.

## Triggers

- **New Pull Request**: Triggers when there is activity on a pull request.
- **New Star**: Triggers when there is activity relating to repository stars.
- **New Issue**: Triggers when there is activity relating to an issue.
- **Push**: Triggers when there is a push to a repository branch.

---

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for everyone. This project follows the [Activepieces Code of Conduct](https://github.com/activepieces/activepieces/blob/main/CODE_OF_CONDUCT.md). We expect all contributors to adhere to these guidelines.

## Contributing

We welcome contributions from the community! Whether you are fixing a bug, implementing a new feature, or improving documentation, your help is appreciated.

To get started:
1. Please review our [Contributing Guide](https://www.activepieces.com/docs/contributing/overview).
2. Check out the [developer documentation](https://www.activepieces.com/docs/developers/overview) for instructions on how to create and modify pieces.
3. Join our [Discord community](https://discord.gg/2jUXBKDdP8) to discuss your ideas and get help.

## License

This piece is part of the Activepieces Community Edition and is released under the **MIT License**. For more details, please see the [LICENSE](https://github.com/activepieces/activepieces/blob/main/LICENSE) file in the root of the repository.

## Security

Security is a top priority for us. If you discover a vulnerability, please report it following the instructions in our [Security Policy](https://github.com/activepieces/activepieces/blob/main/SECURITY.md).

You can also contact our security team directly at [security@activepieces.com](mailto:security@activepieces.com).
