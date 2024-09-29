FROM nginx:stable-alpine

COPY /services/nginx/config /etc/nginx/conf.d/default.conf.template

ENTRYPOINT envsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'