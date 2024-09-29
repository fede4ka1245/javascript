FROM nginx:stable-alpine

COPY /services/nginx/config /etc/nginx/conf.d/default.conf.template

RUN envsubst '${S3_ENDPOINT_URL}' < "/etc/nginx/conf.d/default.conf.template" > "/etc/nginx/conf.d/default.conf"

CMD ["nginx", "-g", "daemon off;"]