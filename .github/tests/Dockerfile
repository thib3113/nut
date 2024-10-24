FROM debian:bullseye-slim

ENV NUT_VERSION=2.8.2

RUN apt update && apt install -y \
    build-essential \
    libssl-dev \
    pkg-config \
    libtool \
    automake \
    autoconf \
    curl \
    openssl \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

RUN curl -L https://github.com/networkupstools/nut/releases/download/v${NUT_VERSION}/nut-${NUT_VERSION}.tar.gz -o /tmp/nut-${NUT_VERSION}.tar.gz

RUN tar xzf /tmp/nut-${NUT_VERSION}.tar.gz -C /usr/src/

WORKDIR /usr/src/nut-${NUT_VERSION}

RUN ./autogen.sh

RUN ./configure \
        --with-openssl \
        --prefix=/etc/nut \
        --with-user=nut \
        --with-group=nut
RUN make
RUN make install

RUN addgroup --system nut && adduser --system nut --group

RUN echo 'MODE=netserver' > /etc/nut/etc/nut.conf && \
    echo '[dummyups]' > /etc/nut/etc/ups.conf && \
    echo 'driver = dummy-ups' >> /etc/nut/etc/ups.conf && \
    echo 'port = /dev/null' >> /etc/nut/etc/ups.conf && \
    echo 'desc = "Dummy UPS for testing"' >> /etc/nut/etc/ups.conf && \
    echo 'mode = dummy-once' >> /etc/nut/etc/ups.conf && \
    echo 'LISTEN 0.0.0.0 3493' > /etc/nut/etc/upsd.conf && \
    echo 'CERTFILE /etc/nut/certs/upsd.pem' >> /etc/nut/etc/upsd.conf && \
    echo "DISABLE_WEAK_SSL true" >> /etc/nut/etc/upsd.conf && \
    echo '[user]' >> /etc/nut/etc/upsd.users && \
    echo 'password = secret' >> /etc/nut/etc/upsd.users && \
    echo 'actions = set' >> /etc/nut/etc/upsd.users && \
    echo 'actions = fsd' >> /etc/nut/etc/upsd.users && \
    echo 'upsmon primary' >> /etc/nut/etc/upsd.users && \
    echo 'instcmds = all' >> /etc/nut/etc/upsd.users

RUN echo 'NOTIFYFLAG ONLINE    SYSLOG' > /etc/nut/etc/upsmon.conf && \
    echo 'NOTIFYFLAG ONBATT    SYSLOG' >> /etc/nut/etc/upsmon.conf && \
    echo 'NOTIFYFLAG LOWBATT   SYSLOG' >> /etc/nut/etc/upsmon.conf && \
    echo 'NOTIFYFLAG FSD       SYSLOG' >> /etc/nut/etc/upsmon.conf && \
    echo 'NOTIFYFLAG COMMOK    SYSLOG' >> /etc/nut/etc/upsmon.conf && \
    echo 'NOTIFYFLAG COMMBAD   SYSLOG' >> /etc/nut/etc/upsmon.conf && \
    echo 'NOTIFYFLAG SHUTDOWN  SYSLOG' >> /etc/nut/etc/upsmon.conf && \
    echo 'NOTIFYFLAG REPLBATT  SYSLOG' >> /etc/nut/etc/upsmon.conf && \
    echo 'NOTIFYFLAG NOCOMM    SYSLOG' >> /etc/nut/etc/upsmon.conf

RUN mkdir -p /var/run/nut /etc/nut/certs/clients /var/state/ups /clients && \
    chown -R nut:nut /var/run/nut /etc/nut /var/state/ups && \
    chmod 700 /var/run/nut /etc/nut /var/state/ups /etc/nut/etc/upsd.conf /etc/nut/etc/upsd.users

RUN openssl req -new -x509 -nodes -out upsd.crt -keyout upsd.key -subj "/C=US/ST=State/L=City/O=Org/OU=IT/CN=localhost" && \
    cp upsd.crt /etc/nut/certs/clients/$(openssl x509 -hash -noout -in upsd.crt).0 && \
    cp upsd.crt /clients/client.crt && \
    cat upsd.crt upsd.key > upsd.pem && \
    chown nut:nut upsd.pem /etc/nut/certs/clients/* && \
    chmod 600 upsd.pem /etc/nut/certs/clients/* && \
    mv upsd.pem /etc/nut/certs/ && \
    chmod 700 /etc/nut/certs/*

RUN apt-get remove --purge -y build-essential \
    && apt-get autoremove -y \
    && rm -rf /usr/src/nut-2.8.2 /tmp/nut-2.8.2.tar.gz

RUN echo "#!/bin/sh" >> /entrypoint.sh && \
    echo "/etc/nut/sbin/upsdrvctl start && /etc/nut/sbin/upsd -D" >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

WORKDIR /etc/nut

EXPOSE 3493

USER nut

CMD ["/entrypoint.sh"]
