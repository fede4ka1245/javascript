FROM nginx:stable-alpine

COPY /services/nginx/config /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]