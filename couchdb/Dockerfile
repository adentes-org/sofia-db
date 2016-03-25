FROM klaemo/couchdb
MAINTAINER Antoine GIRARD <antoine.girard@sapk.fr>

ADD scripts /scripts
ADD admin-app /admin-app

RUN apt-get update -y -qq && apt-get install -y --no-install-recommends netcat pwgen \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN sed -e 's/^database_dir = .*$/database_dir = \/data/' -i /usr/local/etc/couchdb/default.ini && \
    sed -e 's/^view_index_dir = .*$/view_index_dir = \/data/' -i /usr/local/etc/couchdb/default.ini && \
    chmod +x /scripts/*.sh && touch /.firstrun

# Command to run
ENTRYPOINT ["/scripts/run.sh"]
#CMD [""]

# Expose listen port
EXPOSE 5984

# Expose our data, logs and configuration volumes
VOLUME ["/data"]
