node tools/setup-dev.js


CMP+P "Reopen in dev containers"

```
npm start
npm run dev
```

Go to localhost:4200 on your web browser and sign in with these details:
localhost:3000 should be running as well
Email: dev@ap.com Password: 12345678


### 

Setup fork in local git

```
git remote add upstream https://github.com/activepieces/activepieces.git
git remote set-url --push upstream DISABLE
git remote -v
```

Sync Your Fork
To retrieve changes from the “upstream” repository, fetch the remote and rebase your work on top of it.

```
git fetch upstream
git merge upstream/main
```

Conflict resolution should not be necessary since you’ve only added pieces to your repository.