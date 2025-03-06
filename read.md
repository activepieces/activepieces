
### how to dev ###

0.install 
## run
  npm install

1.have to start redis and postgres
*you can start postgres also if you want postgres on you machine
*remove comment about postgres in docker-compose.dev.yml 
## run
  docker-compose -f docker-compose.dev.yml up -d

2.edit env on
  /.env.example
  /packages/server/api/.env

3.start back and front
## run
  npm run start

current-version : avalantglobal/workflow:0.0.2_rc2
### how to build ###
## run
  docker build -t avalantglobal/workflow:0.0.1 .  
  docker push avalantglobal/workflow:0.0.1 
  ## or 
  docker build --no-cache -t  avalantglobal/workflow:0.0.1 .
  docker push avalantglobal/workflow:0.0.1 

### how to test deploy ###
1.goto _test_prod
## run
  cd _test_prod

2.edit env on
  /_test_prod/.env

3.edit service container 
have to use avalantglobal/workflow and redis 
  /_test_prod/docker-compose.yml

4.start service container 
## run 
  cd _test_prod
  docker-compose up -d



### how to commit code ###
1.add file to stage
2.run commit by cmd 
## run
  git commit -m "message" --no-verify
3.push code

###### important ######
## package.json
dev 
  add       "prepare": "husky install",
  remvove   "postinstall": "if [ \"$NODE_ENV\" != \"production\" ]; then husky install; fi",
build 
  add       "postinstall": "if [ \"$NODE_ENV\" != \"production\" ]; then husky install; fi",
  remvove   "prepare": "husky install",
###### important ######


