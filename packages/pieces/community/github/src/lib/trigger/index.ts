import { Trigger } from '@activepieces/pieces-framework';
import { githubRegisterTrigger } from './register-trigger';

export enum GithubEventType {
  PULL_REQUEST = 'pull_request',
  STAR = 'star',
  ISSUES = 'issues',
}

export const registered = [
  {
    name: GithubEventType.PULL_REQUEST,
    displayName: 'New Pull Request',
    description: 'Triggers when there is activity on a pull request.',
    sampleData: {
      action: 'opened',
      number: 2,
      pull_request: {
        url: 'https://api.github.com/repos/activepieces/activepieces/pulls/2',
        id: 1246014943,
        node_id: 'PR_kwDOCfU56M5KRK3f',
        html_url: 'https://github.com/activepieces/activepieces/pull/2',
        diff_url: 'https://github.com/activepieces/activepieces/pull/2.diff',
        patch_url: 'https://github.com/activepieces/activepieces/pull/2.patch',
        issue_url:
          'https://api.github.com/repos/activepieces/activepieces/issues/2',
        number: 2,
        state: 'open',
        locked: false,
        title: 'added',
        user: {
          login: 'jesska',
          id: 391061,
          node_id: 'MDQ6VXNlcjM5MzI2MQ==',
          avatar_url: 'https://avatars.githubusercontent.com/u/393261?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/jesska',
          html_url: 'https://github.com/jesska',
          followers_url: 'https://api.github.com/users/jesska/followers',
          following_url:
            'https://api.github.com/users/jesska/following{/other_user}',
          gists_url: 'https://api.github.com/users/jesska/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/jesska/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/jesska/subscriptions',
          organizations_url: 'https://api.github.com/users/jesska/orgs',
          repos_url: 'https://api.github.com/users/jesska/repos',
          events_url: 'https://api.github.com/users/jesska/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/jesska/received_events',
          type: 'User',
          site_admin: false,
        },
        body: 'test',
        created_at: '2023-02-18T11:36:07Z',
        updated_at: '2023-02-18T11:36:07Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        assignee: null,
        assignees: [],
        requested_reviewers: [],
        requested_teams: [],
        labels: [],
        milestone: null,
        draft: false,
        commits_url:
          'https://api.github.com/repos/activepieces/activepieces/pulls/2/commits',
        review_comments_url:
          'https://api.github.com/repos/activepieces/activepieces/pulls/2/comments',
        review_comment_url:
          'https://api.github.com/repos/activepieces/activepieces/pulls/comments{/number}',
        comments_url:
          'https://api.github.com/repos/activepieces/activepieces/issues/2/comments',
        statuses_url:
          'https://api.github.com/repos/activepieces/activepieces/statuses/309b7842c3c8a7cd275a4a6da1e89713917bcdc6',
        head: {
          label: 'kanarelo:dd',
          ref: 'dd',
          sha: '309b7842c3c8a7cd275a4a6da1e89713917bcdc6',
          user: [Object],
          repo: [Object],
        },
        base: {
          label: 'kanarelo:master',
          ref: 'master',
          sha: '3f80b96f5ba885a21b691b653731520a6000654b',
          user: [Object],
          repo: [Object],
        },
        author_association: 'OWNER',
        auto_merge: null,
        active_lock_reason: null,
        merged: false,
        mergeable: null,
        rebaseable: null,
        mergeable_state: 'unknown',
        merged_by: null,
        comments: 0,
        review_comments: 0,
        maintainer_can_modify: false,
        commits: 1,
        additions: 1,
        deletions: 0,
        changed_files: 1,
      },
      repository: {
        id: 167066088,
        node_id: 'MDEwOlJlcG9zaXRvcnkxNjcwNjYwODg=',
        name: 'activepieces',
        full_name: 'activepieces/activepieces',
        private: false,
        owner: {
          login: 'jesska',
          id: 393261,
          node_id: 'MDQ6VXNlcjM5MzI2MQ==',
          avatar_url: 'https://avatars.githubusercontent.com/u/393261?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/jesska',
          html_url: 'https://github.com/jesska',
          followers_url: 'https://api.github.com/users/jesska/followers',
          following_url:
            'https://api.github.com/users/jesska/following{/other_user}',
          gists_url: 'https://api.github.com/users/jesska/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/jesska/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/jesska/subscriptions',
          organizations_url: 'https://api.github.com/users/jesska/orgs',
          repos_url: 'https://api.github.com/users/jesska/repos',
          events_url: 'https://api.github.com/users/jesska/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/jesska/received_events',
          type: 'User',
          site_admin: false,
        },
        html_url: 'https://github.com/activepieces/activepieces',
        description: 'Automate!',
        fork: false,
        url: 'https://api.github.com/repos/activepieces/activepieces',
        forks_url:
          'https://api.github.com/repos/activepieces/activepieces/forks',
        keys_url:
          'https://api.github.com/repos/activepieces/activepieces/keys{/key_id}',
        collaborators_url:
          'https://api.github.com/repos/activepieces/activepieces/collaborators{/collaborator}',
        teams_url:
          'https://api.github.com/repos/activepieces/activepieces/teams',
        hooks_url:
          'https://api.github.com/repos/activepieces/activepieces/hooks',
        issue_events_url:
          'https://api.github.com/repos/activepieces/activepieces/issues/events{/number}',
        events_url:
          'https://api.github.com/repos/activepieces/activepieces/events',
        assignees_url:
          'https://api.github.com/repos/activepieces/activepieces/assignees{/user}',
        branches_url:
          'https://api.github.com/repos/activepieces/activepieces/branches{/branch}',
        tags_url: 'https://api.github.com/repos/activepieces/activepieces/tags',
        blobs_url:
          'https://api.github.com/repos/activepieces/activepieces/git/blobs{/sha}',
        git_tags_url:
          'https://api.github.com/repos/activepieces/activepieces/git/tags{/sha}',
        git_refs_url:
          'https://api.github.com/repos/activepieces/activepieces/git/refs{/sha}',
        trees_url:
          'https://api.github.com/repos/activepieces/activepieces/git/trees{/sha}',
        statuses_url:
          'https://api.github.com/repos/activepieces/activepieces/statuses/{sha}',
        languages_url:
          'https://api.github.com/repos/activepieces/activepieces/languages',
        stargazers_url:
          'https://api.github.com/repos/activepieces/activepieces/stargazers',
        contributors_url:
          'https://api.github.com/repos/activepieces/activepieces/contributors',
        subscribers_url:
          'https://api.github.com/repos/activepieces/activepieces/subscribers',
        subscription_url:
          'https://api.github.com/repos/activepieces/activepieces/subscription',
        commits_url:
          'https://api.github.com/repos/activepieces/activepieces/commits{/sha}',
        git_commits_url:
          'https://api.github.com/repos/activepieces/activepieces/git/commits{/sha}',
        comments_url:
          'https://api.github.com/repos/activepieces/activepieces/comments{/number}',
        issue_comment_url:
          'https://api.github.com/repos/activepieces/activepieces/issues/comments{/number}',
        contents_url:
          'https://api.github.com/repos/activepieces/activepieces/contents/{+path}',
        compare_url:
          'https://api.github.com/repos/activepieces/activepieces/compare/{base}...{head}',
        merges_url:
          'https://api.github.com/repos/activepieces/activepieces/merges',
        archive_url:
          'https://api.github.com/repos/activepieces/activepieces/{archive_format}{/ref}',
        downloads_url:
          'https://api.github.com/repos/activepieces/activepieces/downloads',
        issues_url:
          'https://api.github.com/repos/activepieces/activepieces/issues{/number}',
        pulls_url:
          'https://api.github.com/repos/activepieces/activepieces/pulls{/number}',
        milestones_url:
          'https://api.github.com/repos/activepieces/activepieces/milestones{/number}',
        notifications_url:
          'https://api.github.com/repos/activepieces/activepieces/notifications{?since,all,participating}',
        labels_url:
          'https://api.github.com/repos/activepieces/activepieces/labels{/name}',
        releases_url:
          'https://api.github.com/repos/activepieces/activepieces/releases{/id}',
        deployments_url:
          'https://api.github.com/repos/activepieces/activepieces/deployments',
        created_at: '2019-01-22T20:57:01Z',
        updated_at: '2023-02-18T11:05:49Z',
        pushed_at: '2019-02-22T20:19:33Z',
        git_url: 'git://github.com/activepieces/activepieces.git',
        ssh_url: 'git@github.com/activepieces/activepieces.git',
        clone_url: 'https://github.com/activepieces/activepieces.git',
        svn_url: 'https://github.com/activepieces/activepieces',
        homepage: null,
        size: 6637,
        stargazers_count: 1,
        watchers_count: 1,
        language: 'CSS',
        has_issues: true,
        has_projects: true,
        has_downloads: true,
        has_wiki: false,
        has_pages: false,
        has_discussions: false,
        forks_count: 0,
        mirror_url: null,
        archived: false,
        disabled: false,
        open_issues_count: 1,
        license: null,
        allow_forking: true,
        is_template: false,
        web_commit_signoff_required: false,
        topics: [],
        visibility: 'public',
        forks: 0,
        open_issues: 1,
        watchers: 1,
        default_branch: 'master',
      },
      sender: {
        login: 'activepieces',
        id: 383262,
        node_id: 'MDQ6VXNlcjM5MzI2MQ==',
        avatar_url: 'https://avatars.githubusercontent.com/u/383262?v=4',
        gravatar_id: '',
        url: 'https://api.github.com/users/activepieces',
        html_url: 'https://github.com/activepieces',
        followers_url: 'https://api.github.com/users/activepieces/followers',
        following_url:
          'https://api.github.com/users/activepieces/following{/other_user}',
        gists_url: 'https://api.github.com/users/activepieces/gists{/gist_id}',
        starred_url:
          'https://api.github.com/users/activepieces/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.github.com/users/activepieces/subscriptions',
        organizations_url: 'https://api.github.com/users/activepieces/orgs',
        repos_url: 'https://api.github.com/users/activepieces/repos',
        events_url:
          'https://api.github.com/users/activepieces/events{/privacy}',
        received_events_url:
          'https://api.github.com/users/activepieces/received_events',
        type: 'User',
        site_admin: false,
      },
    },
  },
  {
    name: GithubEventType.STAR,
    displayName: 'New Star',
    description: 'Trigger when there is activity relating to repository stars.',
    sampleData: {
      action: 'created',
      starred_at: '2023-02-18T11:18:55Z',
      repository: {
        id: 167066548,
        node_id: 'MDEwOlJlcG9zaXRvcnkxNjcwNjYwODg=',
        name: 'csv-2-pdf-report-tool',
        full_name: 'activepieces/activepieces',
        private: false,
        owner: {
          login: 'activepieces',
          id: 303261,
          node_id: 'MDQ6VXNlcjM5MzI2MQ==',
          avatar_url: 'https://avatars.githubusercontent.com/u/393261?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/activepieces',
          html_url: 'https://github.com/activepieces',
          followers_url: 'https://api.github.com/users/activepieces/followers',
          following_url:
            'https://api.github.com/users/activepieces/following{/other_user}',
          gists_url:
            'https://api.github.com/users/activepieces/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/activepieces/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/activepieces/subscriptions',
          organizations_url: 'https://api.github.com/users/activepieces/orgs',
          repos_url: 'https://api.github.com/users/activepieces/repos',
          events_url:
            'https://api.github.com/users/activepieces/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/activepieces/received_events',
          type: 'User',
          site_admin: false,
        },
        html_url: 'https://github.com/activepieces/activepieces',
        description: 'Automate',
        fork: false,
        url: 'https://api.github.com/repos/activepieces/activepieces',
        forks_url:
          'https://api.github.com/repos/activepieces/activepieces/forks',
        keys_url:
          'https://api.github.com/repos/activepieces/activepieces/keys{/key_id}',
        collaborators_url:
          'https://api.github.com/repos/activepieces/activepieces/collaborators{/collaborator}',
        teams_url:
          'https://api.github.com/repos/activepieces/activepieces/teams',
        hooks_url:
          'https://api.github.com/repos/activepieces/activepieces/hooks',
        issue_events_url:
          'https://api.github.com/repos/activepieces/activepieces/issues/events{/number}',
        events_url:
          'https://api.github.com/repos/activepieces/activepieces/events',
        assignees_url:
          'https://api.github.com/repos/activepieces/activepieces/assignees{/user}',
        branches_url:
          'https://api.github.com/repos/activepieces/activepieces/branches{/branch}',
        tags_url: 'https://api.github.com/repos/activepieces/activepieces/tags',
        blobs_url:
          'https://api.github.com/repos/activepieces/activepieces/git/blobs{/sha}',
        git_tags_url:
          'https://api.github.com/repos/activepieces/activepieces/git/tags{/sha}',
        git_refs_url:
          'https://api.github.com/repos/activepieces/activepieces/git/refs{/sha}',
        trees_url:
          'https://api.github.com/repos/activepieces/activepieces/git/trees{/sha}',
        statuses_url:
          'https://api.github.com/repos/activepieces/activepieces/statuses/{sha}',
        languages_url:
          'https://api.github.com/repos/activepieces/activepieces/languages',
        stargazers_url:
          'https://api.github.com/repos/activepieces/activepieces/stargazers',
        contributors_url:
          'https://api.github.com/repos/activepieces/activepieces/contributors',
        subscribers_url:
          'https://api.github.com/repos/activepieces/activepieces/subscribers',
        subscription_url:
          'https://api.github.com/repos/activepieces/activepieces/subscription',
        commits_url:
          'https://api.github.com/repos/activepieces/activepieces/commits{/sha}',
        git_commits_url:
          'https://api.github.com/repos/activepieces/activepieces/git/commits{/sha}',
        comments_url:
          'https://api.github.com/repos/activepieces/activepieces/comments{/number}',
        issue_comment_url:
          'https://api.github.com/repos/activepieces/activepieces/issues/comments{/number}',
        contents_url:
          'https://api.github.com/repos/activepieces/activepieces/contents/{+path}',
        compare_url:
          'https://api.github.com/repos/activepieces/activepieces/compare/{base}...{head}',
        merges_url:
          'https://api.github.com/repos/activepieces/activepieces/merges',
        archive_url:
          'https://api.github.com/repos/activepieces/activepieces/{archive_format}{/ref}',
        downloads_url:
          'https://api.github.com/repos/activepieces/activepieces/downloads',
        issues_url:
          'https://api.github.com/repos/activepieces/activepieces/issues{/number}',
        pulls_url:
          'https://api.github.com/repos/activepieces/activepieces/pulls{/number}',
        milestones_url:
          'https://api.github.com/repos/activepieces/activepieces/milestones{/number}',
        notifications_url:
          'https://api.github.com/repos/activepieces/activepieces/notifications{?since,all,participating}',
        labels_url:
          'https://api.github.com/repos/activepieces/activepieces/labels{/name}',
        releases_url:
          'https://api.github.com/repos/activepieces/activepieces/releases{/id}',
        deployments_url:
          'https://api.github.com/repos/activepieces/activepieces/deployments',
        created_at: '2019-01-22T20:57:01Z',
        updated_at: '2023-02-18T11:18:55Z',
        pushed_at: '2019-02-22T20:19:33Z',
        git_url: 'git://github.com/activepieces/activepieces.git',
        ssh_url: 'git@github.com:activepieces/activepieces.git',
        clone_url: 'https://github.com/activepieces/activepieces.git',
        svn_url: 'https://github.com/activepieces/activepieces',
        homepage: null,
        size: 6637,
        stargazers_count: 1,
        watchers_count: 1,
        language: 'CSS',
        has_issues: true,
        has_projects: true,
        has_downloads: true,
        has_wiki: false,
        has_pages: false,
        has_discussions: false,
        forks_count: 0,
        mirror_url: null,
        archived: false,
        disabled: false,
        open_issues_count: 1,
        license: null,
        allow_forking: true,
        is_template: false,
        web_commit_signoff_required: false,
        topics: [],
        visibility: 'public',
        forks: 0,
        open_issues: 1,
        watchers: 1,
        default_branch: 'master',
      },
      sender: {
        login: 'activepieces',
        id: 383262,
        node_id: 'MDQ6VXNlcjM5MzI2MQ==',
        avatar_url: 'https://avatars.githubusercontent.com/u/383262?v=4',
        gravatar_id: '',
        url: 'https://api.github.com/users/activepieces',
        html_url: 'https://github.com/activepieces',
        followers_url: 'https://api.github.com/users/activepieces/followers',
        following_url:
          'https://api.github.com/users/activepieces/following{/other_user}',
        gists_url: 'https://api.github.com/users/activepieces/gists{/gist_id}',
        starred_url:
          'https://api.github.com/users/activepieces/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.github.com/users/activepieces/subscriptions',
        organizations_url: 'https://api.github.com/users/activepieces/orgs',
        repos_url: 'https://api.github.com/users/activepieces/repos',
        events_url:
          'https://api.github.com/users/activepieces/events{/privacy}',
        received_events_url:
          'https://api.github.com/users/activepieces/received_events',
        type: 'User',
        site_admin: false,
      },
    },
  },
  {
    name: GithubEventType.ISSUES,
    displayName: 'New Issue',
    description: 'Triggers when there is activity relating to an issue.',
    sampleData: {
      action: 'opened',
      issue: {
        url: 'https://api.github.com/repos/activepieces/activepieces/issues/1',
        repository_url:
          'https://api.github.com/repos/activepieces/activepieces',
        labels_url:
          'https://api.github.com/repos/activepieces/activepieces/issues/1/labels{/name}',
        comments_url:
          'https://api.github.com/repos/activepieces/activepieces/issues/1/comments',
        events_url:
          'https://api.github.com/repos/activepieces/activepieces/issues/1/events',
        html_url: 'https://github.com/activepieces/activepieces/issues/1',
        id: 1590311655,
        node_id: 'I_kwDOCfU56M5eyjrn',
        number: 1,
        title: 'New Issue',
        user: {
          login: 'jesska',
          id: 391061,
          node_id: 'MDQ6VXNlcjM5MzI2MQ==',
          avatar_url: 'https://avatars.githubusercontent.com/u/393261?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/jesska',
          html_url: 'https://github.com/jesska',
          followers_url: 'https://api.github.com/users/jesska/followers',
          following_url:
            'https://api.github.com/users/jesska/following{/other_user}',
          gists_url: 'https://api.github.com/users/jesska/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/jesska/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/jesska/subscriptions',
          organizations_url: 'https://api.github.com/users/jesska/orgs',
          repos_url: 'https://api.github.com/users/jesska/repos',
          events_url: 'https://api.github.com/users/jesska/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/jesska/received_events',
          type: 'User',
          site_admin: false,
        },
        labels: [],
        state: 'open',
        locked: false,
        assignee: null,
        assignees: [],
        milestone: null,
        comments: 0,
        created_at: '2023-02-18T11:07:40Z',
        updated_at: '2023-02-18T11:07:40Z',
        closed_at: null,
        author_association: 'OWNER',
        active_lock_reason: null,
        body: 'Test',
        reactions: {
          url: 'https://api.github.com/repos/activepieces/activepieces/issues/1/reactions',
          total_count: 0,
          '+1': 0,
          '-1': 0,
          laugh: 0,
          hooray: 0,
          confused: 0,
          heart: 0,
          rocket: 0,
          eyes: 0,
        },
        timeline_url:
          'https://api.github.com/repos/activepieces/activepieces/issues/1/timeline',
        performed_via_github_app: null,
        state_reason: null,
      },
      repository: {
        id: 167066088,
        node_id: 'MDEwOlJlcG9zaXRvcnkxNjcwNjYwODg=',
        name: 'activepieces',
        full_name: 'activepieces/activepieces',
        private: false,
        owner: {
          login: 'jesska',
          id: 393261,
          node_id: 'MDQ6VXNlcjM5MzI2MQ==',
          avatar_url: 'https://avatars.githubusercontent.com/u/393261?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/jesska',
          html_url: 'https://github.com/jesska',
          followers_url: 'https://api.github.com/users/jesska/followers',
          following_url:
            'https://api.github.com/users/jesska/following{/other_user}',
          gists_url: 'https://api.github.com/users/jesska/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/jesska/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/jesska/subscriptions',
          organizations_url: 'https://api.github.com/users/jesska/orgs',
          repos_url: 'https://api.github.com/users/jesska/repos',
          events_url: 'https://api.github.com/users/jesska/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/jesska/received_events',
          type: 'User',
          site_admin: false,
        },
        html_url: 'https://github.com/activepieces/activepieces',
        description: 'Automate!',
        fork: false,
        url: 'https://api.github.com/repos/activepieces/activepieces',
        forks_url:
          'https://api.github.com/repos/activepieces/activepieces/forks',
        keys_url:
          'https://api.github.com/repos/activepieces/activepieces/keys{/key_id}',
        collaborators_url:
          'https://api.github.com/repos/activepieces/activepieces/collaborators{/collaborator}',
        teams_url:
          'https://api.github.com/repos/activepieces/activepieces/teams',
        hooks_url:
          'https://api.github.com/repos/activepieces/activepieces/hooks',
        issue_events_url:
          'https://api.github.com/repos/activepieces/activepieces/issues/events{/number}',
        events_url:
          'https://api.github.com/repos/activepieces/activepieces/events',
        assignees_url:
          'https://api.github.com/repos/activepieces/activepieces/assignees{/user}',
        branches_url:
          'https://api.github.com/repos/activepieces/activepieces/branches{/branch}',
        tags_url: 'https://api.github.com/repos/activepieces/activepieces/tags',
        blobs_url:
          'https://api.github.com/repos/activepieces/activepieces/git/blobs{/sha}',
        git_tags_url:
          'https://api.github.com/repos/activepieces/activepieces/git/tags{/sha}',
        git_refs_url:
          'https://api.github.com/repos/activepieces/activepieces/git/refs{/sha}',
        trees_url:
          'https://api.github.com/repos/activepieces/activepieces/git/trees{/sha}',
        statuses_url:
          'https://api.github.com/repos/activepieces/activepieces/statuses/{sha}',
        languages_url:
          'https://api.github.com/repos/activepieces/activepieces/languages',
        stargazers_url:
          'https://api.github.com/repos/activepieces/activepieces/stargazers',
        contributors_url:
          'https://api.github.com/repos/activepieces/activepieces/contributors',
        subscribers_url:
          'https://api.github.com/repos/activepieces/activepieces/subscribers',
        subscription_url:
          'https://api.github.com/repos/activepieces/activepieces/subscription',
        commits_url:
          'https://api.github.com/repos/activepieces/activepieces/commits{/sha}',
        git_commits_url:
          'https://api.github.com/repos/activepieces/activepieces/git/commits{/sha}',
        comments_url:
          'https://api.github.com/repos/activepieces/activepieces/comments{/number}',
        issue_comment_url:
          'https://api.github.com/repos/activepieces/activepieces/issues/comments{/number}',
        contents_url:
          'https://api.github.com/repos/activepieces/activepieces/contents/{+path}',
        compare_url:
          'https://api.github.com/repos/activepieces/activepieces/compare/{base}...{head}',
        merges_url:
          'https://api.github.com/repos/activepieces/activepieces/merges',
        archive_url:
          'https://api.github.com/repos/activepieces/activepieces/{archive_format}{/ref}',
        downloads_url:
          'https://api.github.com/repos/activepieces/activepieces/downloads',
        issues_url:
          'https://api.github.com/repos/activepieces/activepieces/issues{/number}',
        pulls_url:
          'https://api.github.com/repos/activepieces/activepieces/pulls{/number}',
        milestones_url:
          'https://api.github.com/repos/activepieces/activepieces/milestones{/number}',
        notifications_url:
          'https://api.github.com/repos/activepieces/activepieces/notifications{?since,all,participating}',
        labels_url:
          'https://api.github.com/repos/activepieces/activepieces/labels{/name}',
        releases_url:
          'https://api.github.com/repos/activepieces/activepieces/releases{/id}',
        deployments_url:
          'https://api.github.com/repos/activepieces/activepieces/deployments',
        created_at: '2019-01-22T20:57:01Z',
        updated_at: '2023-02-18T11:05:49Z',
        pushed_at: '2019-02-22T20:19:33Z',
        git_url: 'git://github.com/activepieces/activepieces.git',
        ssh_url: 'git@github.com/activepieces/activepieces.git',
        clone_url: 'https://github.com/activepieces/activepieces.git',
        svn_url: 'https://github.com/activepieces/activepieces',
        homepage: null,
        size: 6637,
        stargazers_count: 1,
        watchers_count: 1,
        language: 'CSS',
        has_issues: true,
        has_projects: true,
        has_downloads: true,
        has_wiki: false,
        has_pages: false,
        has_discussions: false,
        forks_count: 0,
        mirror_url: null,
        archived: false,
        disabled: false,
        open_issues_count: 1,
        license: null,
        allow_forking: true,
        is_template: false,
        web_commit_signoff_required: false,
        topics: [],
        visibility: 'public',
        forks: 0,
        open_issues: 1,
        watchers: 1,
        default_branch: 'master',
      },
      sender: {
        login: 'activepieces',
        id: 383262,
        node_id: 'MDQ6VXNlcjM5MzI2MQ==',
        avatar_url: 'https://avatars.githubusercontent.com/u/383262?v=4',
        gravatar_id: '',
        url: 'https://api.github.com/users/activepieces',
        html_url: 'https://github.com/activepieces',
        followers_url: 'https://api.github.com/users/activepieces/followers',
        following_url:
          'https://api.github.com/users/activepieces/following{/other_user}',
        gists_url: 'https://api.github.com/users/activepieces/gists{/gist_id}',
        starred_url:
          'https://api.github.com/users/activepieces/starred{/owner}{/repo}',
        subscriptions_url:
          'https://api.github.com/users/activepieces/subscriptions',
        organizations_url: 'https://api.github.com/users/activepieces/orgs',
        repos_url: 'https://api.github.com/users/activepieces/repos',
        events_url:
          'https://api.github.com/users/activepieces/events{/privacy}',
        received_events_url:
          'https://api.github.com/users/activepieces/received_events',
        type: 'User',
        site_admin: false,
      },
    },
  },
];

export const githubTriggers: Trigger[] = registered.map((def) =>
  githubRegisterTrigger(def)
);
