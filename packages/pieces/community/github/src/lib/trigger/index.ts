import { Trigger } from '@activepieces/pieces-framework';
import { githubRegisterTrigger } from './register-trigger';
import { newBranchTrigger } from './new-branch';
import { newCollaboratorTrigger } from './new-collaborator';
import { newLabelTrigger } from './new-label';
import { newMilestoneTrigger } from './new-milestone';
import { newReleaseTrigger } from './new-release';

export enum GithubEventType {
  PULL_REQUEST = 'pull_request',
  STAR = 'star',
  ISSUES = 'issues',
  PUSH = 'push',
  DISCUSSION = 'discussion',
  DISCUSSION_COMMENT = 'discussion_comment',
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
        id: 1234,
        node_id: 'MDQ6VXNlcjM5MzI2MQ==',
        avatar_url: 'https://avatars.githubusercontent.com/u/1234?v=4',
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
        id: 1234,
        node_id: 'MDQ6VXNlcjM5MzI2MQ==',
        avatar_url: 'https://avatars.githubusercontent.com/u/1234?v=4',
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
        id: 1234,
        node_id: 'MDQ6VXNlcjM5MzI2MQ==',
        avatar_url: 'https://avatars.githubusercontent.com/u/1234?v=4',
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
    name: GithubEventType.PUSH,
    displayName: 'Push',
    description:
      'Triggers when there is a push to a repository branch. This includes when a commit is pushed, when a commit tag is pushed, when a branch is deleted, when a tag is deleted, or when a repository is created from a template.',
    sampleData: {
      after: 'sha1',
      base_ref: 'main',
      before: 'sha1',
      commits: [
        {
          added: ['file1'],
          author: {
            username: 'Username',
            name: 'Full Name',
            email: 'user@github.com',
          },
          committer: {
            username: 'Username',
            name: 'Full Name',
            email: 'user@github.com',
          },
          distinct: true,
          id: '',
          message: 'commit message',
          modified: ['file2'],
          removed: ['file3'],
          timestamp: '',
          tree_id: '',
          url: '',
        },
      ],
      compare: 'url',
      created: true,
      deleted: false,
      enterprise: {},
      forced: false,
      head_commit: {},
      installation: {},
      organization: {},
      pusher: {
        username: 'Username',
        name: 'Full Name',
        email: 'user@github.com',
      },
      ref: 'main',
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
        id: 1234,
        node_id: 'MDQ6VXNlcjM5MzI2MQ==',
        avatar_url: 'https://avatars.githubusercontent.com/u/1234?v=4',
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
    name: GithubEventType.DISCUSSION,
    displayName: 'New Discussion',
    description: 'Triggers when there is activity relating to a discussion.',
    sampleData: {
      action: 'created',
      discussion: {
        repository_url: 'https://api.github.com/repos/my-org/Topics',
        category: {
          id: 1234567890,
          node_id: 'DIC_kwDOBJHGx84CWC0J',
          repository_id: 1234567890,
          emoji: ':speech_balloon:',
          name: 'Discussions',
          description:
            'Use “Saved replies” as templates. Type “/saved replies” in text field to get started',
          created_at: '2023-04-25T17:47:04.000+02:00',
          updated_at: '2023-05-03T14:04:13.000+02:00',
          slug: 'discussions',
          is_answerable: true,
        },
        answer_html_url: null,
        answer_chosen_at: null,
        answer_chosen_by: null,
        html_url: 'https://github.com/my-org/Topics/discussions/1234567890',
        id: 1234567890,
        node_id: 'D_kwDOBJHGx84AgH6R',
        number: 1234567890,
        title: 'TEST',
        user: {
          login: 'BenBen',
          id: 1234567890,
          node_id: 'MDQ6VXNlcjQyODMxNjA2',
          avatar_url: 'https://avatars.githubusercontent.com/u/1234567890?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/BenBen',
          html_url: 'https://github.com/BenBen',
          followers_url: 'https://api.github.com/users/BenBen/followers',
          following_url:
            'https://api.github.com/users/BenBen/following{/other_user}',
          gists_url: 'https://api.github.com/users/BenBen/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/BenBen/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/BenBen/subscriptions',
          organizations_url: 'https://api.github.com/users/BenBen/orgs',
          repos_url: 'https://api.github.com/users/BenBen/repos',
          events_url: 'https://api.github.com/users/BenBen/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/BenBen/received_events',
          type: 'User',
          user_view_type: 'public',
          site_admin: false,
        },
        labels: [],
        state: 'open',
        state_reason: null,
        locked: false,
        comments: 0,
        created_at: '2025-06-05T13:25:58Z',
        updated_at: '2025-06-05T13:25:58Z',
        author_association: 'NONE',
        active_lock_reason: null,
        body: 'TEST @coach',
        reactions: {
          url: 'https://api.github.com/repos/my-org/Topics/discussions/1234567890/reactions',
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
          'https://api.github.com/repos/my-org/Topics/discussions/1234567890/timeline',
      },
      repository: {
        id: 1234567890,
        node_id: 'MDEwOlJlcG9zaXRvcnk3NjY2MjQ3MQ==',
        name: 'Topics',
        full_name: 'my-org/Topics',
        private: true,
        owner: {
          login: 'my-org',
          id: 1234567890,
          node_id: 'MDEyOk9yZ2FuaXphdGlvbjE4MTc1MzI5',
          avatar_url: 'https://avatars.githubusercontent.com/u/1234567890?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/my-org',
          html_url: 'https://github.com/my-org',
          followers_url: 'https://api.github.com/users/my-org/followers',
          following_url:
            'https://api.github.com/users/my-org/following{/other_user}',
          gists_url: 'https://api.github.com/users/my-org/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/my-org/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/my-org/subscriptions',
          organizations_url: 'https://api.github.com/users/my-org/orgs',
          repos_url: 'https://api.github.com/users/my-org/repos',
          events_url: 'https://api.github.com/users/my-org/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/my-org/received_events',
          type: 'Organization',
          user_view_type: 'public',
          site_admin: false,
        },
        html_url: 'https://github.com/my-org/Topics',
        description: 'The My-ORG Issue repository ',
        fork: false,
        url: 'https://api.github.com/repos/my-org/Topics',
        forks_url: 'https://api.github.com/repos/my-org/Topics/forks',
        keys_url: 'https://api.github.com/repos/my-org/Topics/keys{/key_id}',
        collaborators_url:
          'https://api.github.com/repos/my-org/Topics/collaborators{/collaborator}',
        teams_url: 'https://api.github.com/repos/my-org/Topics/teams',
        hooks_url: 'https://api.github.com/repos/my-org/Topics/hooks',
        issue_events_url:
          'https://api.github.com/repos/my-org/Topics/issues/events{/number}',
        events_url: 'https://api.github.com/repos/my-org/Topics/events',
        assignees_url:
          'https://api.github.com/repos/my-org/Topics/assignees{/user}',
        branches_url:
          'https://api.github.com/repos/my-org/Topics/branches{/branch}',
        tags_url: 'https://api.github.com/repos/my-org/Topics/tags',
        blobs_url: 'https://api.github.com/repos/my-org/Topics/git/blobs{/sha}',
        git_tags_url:
          'https://api.github.com/repos/my-org/Topics/git/tags{/sha}',
        git_refs_url:
          'https://api.github.com/repos/my-org/Topics/git/refs{/sha}',
        trees_url: 'https://api.github.com/repos/my-org/Topics/git/trees{/sha}',
        statuses_url:
          'https://api.github.com/repos/my-org/Topics/statuses/{sha}',
        languages_url: 'https://api.github.com/repos/my-org/Topics/languages',
        stargazers_url: 'https://api.github.com/repos/my-org/Topics/stargazers',
        contributors_url:
          'https://api.github.com/repos/my-org/Topics/contributors',
        subscribers_url:
          'https://api.github.com/repos/my-org/Topics/subscribers',
        subscription_url:
          'https://api.github.com/repos/my-org/Topics/subscription',
        commits_url: 'https://api.github.com/repos/my-org/Topics/commits{/sha}',
        git_commits_url:
          'https://api.github.com/repos/my-org/Topics/git/commits{/sha}',
        comments_url:
          'https://api.github.com/repos/my-org/Topics/comments{/number}',
        issue_comment_url:
          'https://api.github.com/repos/my-org/Topics/issues/comments{/number}',
        contents_url:
          'https://api.github.com/repos/my-org/Topics/contents/{+path}',
        compare_url:
          'https://api.github.com/repos/my-org/Topics/compare/{base}...{head}',
        merges_url: 'https://api.github.com/repos/my-org/Topics/merges',
        archive_url:
          'https://api.github.com/repos/my-org/Topics/{archive_format}{/ref}',
        downloads_url: 'https://api.github.com/repos/my-org/Topics/downloads',
        issues_url:
          'https://api.github.com/repos/my-org/Topics/issues{/number}',
        pulls_url: 'https://api.github.com/repos/my-org/Topics/pulls{/number}',
        milestones_url:
          'https://api.github.com/repos/my-org/Topics/milestones{/number}',
        notifications_url:
          'https://api.github.com/repos/my-org/Topics/notifications{?since,all,participating}',
        labels_url: 'https://api.github.com/repos/my-org/Topics/labels{/name}',
        releases_url:
          'https://api.github.com/repos/my-org/Topics/releases{/id}',
        deployments_url:
          'https://api.github.com/repos/my-org/Topics/deployments',
        created_at: '2016-12-16T15:05:45Z',
        updated_at: '2025-05-12T15:04:29Z',
        pushed_at: '2024-03-11T10:31:39Z',
        git_url: 'git://github.com/my-org/Topics.git',
        ssh_url: 'git@github.com:my-org/Topics.git',
        clone_url: 'https://github.com/my-org/Topics.git',
        svn_url: 'https://github.com/my-org/Topics',
        homepage: '',
        size: 2305,
        stargazers_count: 64,
        watchers_count: 64,
        language: null,
        has_issues: true,
        has_projects: true,
        has_downloads: true,
        has_wiki: true,
        has_pages: false,
        has_discussions: true,
        forks_count: 0,
        mirror_url: null,
        archived: false,
        disabled: false,
        open_issues_count: 2,
        license: null,
        allow_forking: true,
        is_template: false,
        web_commit_signoff_required: false,
        topics: [],
        visibility: 'private',
        forks: 0,
        open_issues: 2,
        watchers: 64,
        default_branch: 'master',
        custom_properties: {},
      },
      organization: {
        login: 'my-org',
        id: 1234567890,
        node_id: 'MDEyOk9yZ2FuaXphdGlvbjE4MTc1MzI5',
        url: 'https://api.github.com/orgs/my-org',
        repos_url: 'https://api.github.com/orgs/my-org/repos',
        events_url: 'https://api.github.com/orgs/my-org/events',
        hooks_url: 'https://api.github.com/orgs/my-org/hooks',
        issues_url: 'https://api.github.com/orgs/my-org/issues',
        members_url: 'https://api.github.com/orgs/my-org/members{/member}',
        public_members_url:
          'https://api.github.com/orgs/my-org/public_members{/member}',
        avatar_url: 'https://avatars.githubusercontent.com/u/1234567890?v=4',
        description: "Building Europe's all-in-one health partner",
      },
      sender: {
        login: 'BenBen',
        id: 1234567890,
        node_id: 'MDQ6VXNlcjQyODMxNjA2',
        avatar_url: 'https://avatars.githubusercontent.com/u/1234567890?v=4',
        gravatar_id: '',
        url: 'https://api.github.com/users/BenBen',
        html_url: 'https://github.com/BenBen',
        followers_url: 'https://api.github.com/users/BenBen/followers',
        following_url:
          'https://api.github.com/users/BenBen/following{/other_user}',
        gists_url: 'https://api.github.com/users/BenBen/gists{/gist_id}',
        starred_url:
          'https://api.github.com/users/BenBen/starred{/owner}{/repo}',
        subscriptions_url: 'https://api.github.com/users/BenBen/subscriptions',
        organizations_url: 'https://api.github.com/users/BenBen/orgs',
        repos_url: 'https://api.github.com/users/BenBen/repos',
        events_url: 'https://api.github.com/users/BenBen/events{/privacy}',
        received_events_url:
          'https://api.github.com/users/BenBen/received_events',
        type: 'User',
        user_view_type: 'public',
        site_admin: false,
      },
    },
  },

  {
    name: GithubEventType.DISCUSSION_COMMENT,
    displayName: 'New Comment Posted',
    description: 'Triggers when there is a new comment posted on a discussion.',
    sampleData: {
      action: 'created',
      comment: {
        id: 1234567890,
        node_id: 'DC_kwDOBJHGx84AzClv',
        html_url:
          'https://github.com/my-org/Topics/discussions/1234567890#discussioncomment-1234567890',
        parent_id: 1234567890,
        child_comment_count: 0,
        repository_url: 'my-org/Topics',
        discussion_id: 1234567890,
        author_association: 'CONTRIBUTOR',
        user: {
          login: 'alaner',
          id: 1234567890,
          node_id: 'MDQ6VXNlcjQyNDY0NzA0',
          avatar_url: 'https://avatars.githubusercontent.com/u/1234567890?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/alaner',
          html_url: 'https://github.com/alaner',
          followers_url: 'https://api.github.com/users/alaner/followers',
          following_url:
            'https://api.github.com/users/alaner/following{/other_user}',
          gists_url: 'https://api.github.com/users/alaner/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/alaner/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/alaner/subscriptions',
          organizations_url: 'https://api.github.com/users/alaner/orgs',
          repos_url: 'https://api.github.com/users/alaner/repos',
          events_url: 'https://api.github.com/users/alaner/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/alaner/received_events',
          type: 'User',
          user_view_type: 'public',
          site_admin: false,
        },
        created_at: '2025-06-05T13:27:58Z',
        updated_at: '2025-06-05T13:27:58Z',
        body: 'Cool ! ',
        reactions: {
          url: 'https://api.github.com/repos/my-org/Topics/discussions/comments/1234567890/reactions',
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
      },
      discussion: {
        repository_url: 'https://api.github.com/repos/my-org/Topics',
        category: {
          id: 1234567890,
          node_id: 'DIC_kwDOBJHGx84CWAk6',
          repository_id: 1234567890,
          emoji: ':speech_balloon:',
          name: 'Guided Discussions',
          description:
            'For Alaners less familiar with discussions who would like extra guidance',
          created_at: '2023-04-24T11:06:26.000+02:00',
          updated_at: '2023-05-03T14:10:16.000+02:00',
          slug: 'guided-discussions',
          is_answerable: true,
        },
        answer_html_url: null,
        answer_chosen_at: null,
        answer_chosen_by: null,
        html_url: 'https://github.com/my-org/Topics/discussions/1234567890',
        id: 1234567890,
        node_id: 'D_kwDOBJHGx84Af-_L',
        number: 1234567890,
        title: 'Framing - Members communications for QVCT',
        user: {
          login: 'alaner',
          id: 1234567890,
          node_id: 'U_kgDOB0ODWw',
          avatar_url: 'https://avatars.githubusercontent.com/u/1234567890?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/alaner',
          html_url: 'https://github.com/alaner',
          followers_url: 'https://api.github.com/users/alaner/followers',
          following_url:
            'https://api.github.com/users/alaner/following{/other_user}',
          gists_url: 'https://api.github.com/users/alaner/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/alaner/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/alaner/subscriptions',
          organizations_url: 'https://api.github.com/users/alaner/orgs',
          repos_url: 'https://api.github.com/users/alaner/repos',
          events_url: 'https://api.github.com/users/alaner/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/alaner/received_events',
          type: 'User',
          user_view_type: 'public',
          site_admin: false,
        },
        labels: [
          {
            id: 1234567890,
            node_id: 'LA_kwDOBJHGx88AAAABlyvmxg',
            url: 'https://api.github.com/repos/my-org/Topics/labels/%F0%9F%AB%90%20Play',
            name: '🫐 Play',
            color: '9ED9F5',
            default: false,
            description: '',
          },
        ],
        state: 'open',
        state_reason: null,
        locked: false,
        comments: 31,
        created_at: '2025-05-28T12:48:07Z',
        updated_at: '2025-06-05T13:27:59Z',
        author_association: 'NONE',
        active_lock_reason: null,
        body: "### 🔭 Scope\r\n\r\n\r\nThe goal of this discussion is to determine the optimal member communication strategy for the QVCT campaign, focusing on targeting, messaging angles, and campaigns coordination \r\n\r\n\r\n### 🕐 Why I'm opening this discussion\r\nWe need to determine the most effective approach for member communications to prevent spamming and member fatigue, while also ensuring this campaign is well-coordinated with our other Play initiatives.\r\n\r\n### 📅 Timeline\r\n\r\nI’d like to close this discussion by June 4th. \r\n\r\n### ℹ️ LOCI\r\n\r\n- **Lead:** @alaner \r\n- **Owner**: @alaner \r\n- **Consulted**: @alaner , @alaner \r\n- **Informed**: Crew play\r\n\r\n### 🌐 Context & Materials\r\n\r\n- Existing adoption campaigns running parallel to QVCT\r\n- Daily reminders campaign\r\n- Link to Figjam with assets to build\r\n\r\n### Threads\r\n\r\n- [X] You can use threads [meaning you can write a reply within a thread]\r\n- [ ] Please do not use threads [always suggest a new answer as a main message]\r\n\r\n❓ Questions are listed in each thread",
        reactions: {
          url: 'https://api.github.com/repos/my-org/Topics/discussions/1234567890/reactions',
          total_count: 2,
          '+1': 2,
          '-1': 0,
          laugh: 0,
          hooray: 0,
          confused: 0,
          heart: 0,
          rocket: 0,
          eyes: 0,
        },
        timeline_url:
          'https://api.github.com/repos/my-org/Topics/discussions/1234567890/timeline',
      },
      repository: {
        id: 1234567890,
        node_id: 'MDEwOlJlcG9zaXRvcnk3NjY2MjQ3MQ==',
        name: 'Topics',
        full_name: 'my-org/Topics',
        private: true,
        owner: {
          login: 'my-org',
          id: 1234567890,
          node_id: 'MDEyOk9yZ2FuaXphdGlvbjE4MTc1MzI5',
          avatar_url: 'https://avatars.githubusercontent.com/u/1234567890?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/my-org',
          html_url: 'https://github.com/my-org',
          followers_url: 'https://api.github.com/users/my-org/followers',
          following_url:
            'https://api.github.com/users/my-org/following{/other_user}',
          gists_url: 'https://api.github.com/users/my-org/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/my-org/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/my-org/subscriptions',
          organizations_url: 'https://api.github.com/users/my-org/orgs',
          repos_url: 'https://api.github.com/users/my-org/repos',
          events_url: 'https://api.github.com/users/my-org/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/my-org/received_events',
          type: 'Organization',
          user_view_type: 'public',
          site_admin: false,
        },
        html_url: 'https://github.com/my-org/Topics',
        description: 'The My-ORG Issue repository ',
        fork: false,
        url: 'https://api.github.com/repos/my-org/Topics',
        forks_url: 'https://api.github.com/repos/my-org/Topics/forks',
        keys_url: 'https://api.github.com/repos/my-org/Topics/keys{/key_id}',
        collaborators_url:
          'https://api.github.com/repos/my-org/Topics/collaborators{/collaborator}',
        teams_url: 'https://api.github.com/repos/my-org/Topics/teams',
        hooks_url: 'https://api.github.com/repos/my-org/Topics/hooks',
        issue_events_url:
          'https://api.github.com/repos/my-org/Topics/issues/events{/number}',
        events_url: 'https://api.github.com/repos/my-org/Topics/events',
        assignees_url:
          'https://api.github.com/repos/my-org/Topics/assignees{/user}',
        branches_url:
          'https://api.github.com/repos/my-org/Topics/branches{/branch}',
        tags_url: 'https://api.github.com/repos/my-org/Topics/tags',
        blobs_url: 'https://api.github.com/repos/my-org/Topics/git/blobs{/sha}',
        git_tags_url:
          'https://api.github.com/repos/my-org/Topics/git/tags{/sha}',
        git_refs_url:
          'https://api.github.com/repos/my-org/Topics/git/refs{/sha}',
        trees_url: 'https://api.github.com/repos/my-org/Topics/git/trees{/sha}',
        statuses_url:
          'https://api.github.com/repos/my-org/Topics/statuses/{sha}',
        languages_url: 'https://api.github.com/repos/my-org/Topics/languages',
        stargazers_url: 'https://api.github.com/repos/my-org/Topics/stargazers',
        contributors_url:
          'https://api.github.com/repos/my-org/Topics/contributors',
        subscribers_url:
          'https://api.github.com/repos/my-org/Topics/subscribers',
        subscription_url:
          'https://api.github.com/repos/my-org/Topics/subscription',
        commits_url: 'https://api.github.com/repos/my-org/Topics/commits{/sha}',
        git_commits_url:
          'https://api.github.com/repos/my-org/Topics/git/commits{/sha}',
        comments_url:
          'https://api.github.com/repos/my-org/Topics/comments{/number}',
        issue_comment_url:
          'https://api.github.com/repos/my-org/Topics/issues/comments{/number}',
        contents_url:
          'https://api.github.com/repos/my-org/Topics/contents/{+path}',
        compare_url:
          'https://api.github.com/repos/my-org/Topics/compare/{base}...{head}',
        merges_url: 'https://api.github.com/repos/my-org/Topics/merges',
        archive_url:
          'https://api.github.com/repos/my-org/Topics/{archive_format}{/ref}',
        downloads_url: 'https://api.github.com/repos/my-org/Topics/downloads',
        issues_url:
          'https://api.github.com/repos/my-org/Topics/issues{/number}',
        pulls_url: 'https://api.github.com/repos/my-org/Topics/pulls{/number}',
        milestones_url:
          'https://api.github.com/repos/my-org/Topics/milestones{/number}',
        notifications_url:
          'https://api.github.com/repos/my-org/Topics/notifications{?since,all,participating}',
        labels_url: 'https://api.github.com/repos/my-org/Topics/labels{/name}',
        releases_url:
          'https://api.github.com/repos/my-org/Topics/releases{/id}',
        deployments_url:
          'https://api.github.com/repos/my-org/Topics/deployments',
        created_at: '2016-12-16T15:05:45Z',
        updated_at: '2025-05-12T15:04:29Z',
        pushed_at: '2024-03-11T10:31:39Z',
        git_url: 'git://github.com/my-org/Topics.git',
        ssh_url: 'git@github.com:my-org/Topics.git',
        clone_url: 'https://github.com/my-org/Topics.git',
        svn_url: 'https://github.com/my-org/Topics',
        homepage: '',
        size: 2305,
        stargazers_count: 64,
        watchers_count: 64,
        language: null,
        has_issues: true,
        has_projects: true,
        has_downloads: true,
        has_wiki: true,
        has_pages: false,
        has_discussions: true,
        forks_count: 0,
        mirror_url: null,
        archived: false,
        disabled: false,
        open_issues_count: 2,
        license: null,
        allow_forking: true,
        is_template: false,
        web_commit_signoff_required: false,
        topics: [],
        visibility: 'private',
        forks: 0,
        open_issues: 2,
        watchers: 64,
        default_branch: 'master',
        custom_properties: {},
      },
      organization: {
        login: 'my-org',
        id: 1234567890,
        node_id: 'MDEyOk9yZ2FuaXphdGlvbjE4MTc1MzI5',
        url: 'https://api.github.com/orgs/my-org',
        repos_url: 'https://api.github.com/orgs/my-org/repos',
        events_url: 'https://api.github.com/orgs/my-org/events',
        hooks_url: 'https://api.github.com/orgs/my-org/hooks',
        issues_url: 'https://api.github.com/orgs/my-org/issues',
        members_url: 'https://api.github.com/orgs/my-org/members{/member}',
        public_members_url:
          'https://api.github.com/orgs/my-org/public_members{/member}',
        avatar_url: 'https://avatars.githubusercontent.com/u/1234567890?v=4',
        description: "Building Europe's all-in-one health partner",
      },
      sender: {
        login: 'alaner',
        id: 1234567890,
        node_id: 'MDQ6VXNlcjQyNDY0NzA0',
        avatar_url: 'https://avatars.githubusercontent.com/u/1234567890?v=4',
        gravatar_id: '',
        url: 'https://api.github.com/users/alaner',
        html_url: 'https://github.com/alaner',
        followers_url: 'https://api.github.com/users/alaner/followers',
        following_url:
          'https://api.github.com/users/alaner/following{/other_user}',
        gists_url: 'https://api.github.com/users/alaner/gists{/gist_id}',
        starred_url:
          'https://api.github.com/users/alaner/starred{/owner}{/repo}',
        subscriptions_url: 'https://api.github.com/users/alaner/subscriptions',
        organizations_url: 'https://api.github.com/users/alaner/orgs',
        repos_url: 'https://api.github.com/users/alaner/repos',
        events_url: 'https://api.github.com/users/alaner/events{/privacy}',
        received_events_url:
          'https://api.github.com/users/alaner/received_events',
        type: 'User',
        user_view_type: 'public',
        site_admin: false,
      },
    },
  },
];

export const githubTriggers: Trigger[] = [
  ...registered.map((def) => githubRegisterTrigger(def)),
  newBranchTrigger,
  newCollaboratorTrigger,
  newLabelTrigger,
  newMilestoneTrigger,
  newReleaseTrigger,
];
