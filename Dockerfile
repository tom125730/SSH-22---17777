FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY index.html app.js styles.css ./

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:80/ || exit 1
