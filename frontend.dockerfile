FROM nginx:1.23.3-alpine
COPY packages/frontend/nginx.conf /etc/nginx/templates/nginx.conf.template
COPY dist/packages/frontend /usr/share/nginx/html