FROM alpine:3.4
MAINTAINER Antoine GIRARD <antoine.girard@sapk.fr>
# Inspired from https://github.com/abiosoft/caddy-docker/blob/master/Dockerfile

LABEL caddy_version="0.9.0" architecture="amd64"
RUN apk add --no-cache --update curl tar

RUN curl --silent --show-error --fail --location \
      --header "Accept: application/tar+gzip, application/x-gzip, application/octet-stream" -o - \
      "https://caddyserver.com/download/build?os=linux&arch=amd64" \
    | tar --no-same-owner -C /usr/bin/ -xz caddy \
 && chmod 0755 /usr/bin/caddy \
 && /usr/bin/caddy -version

ADD Caddyfile /etc/Caddyfile

EXPOSE 80 443 5984

ENTRYPOINT ["/usr/bin/caddy"]
CMD ["--port", "5984", "--conf", "/etc/Caddyfile"]
