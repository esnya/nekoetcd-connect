'use strict';

const fs = require('fs-promise');
const request = require('request-promise');
const os = require('os');

const app = process.env.APP;
const hosts = os.platform() === 'win32'
        ? `${process.env.SystemRoot}/System32/drivers/etc/hosts`
        : '/etc/hosts';
const logger = console;
const etcd = process.env.ETCD_URL || 'http://etcd:4001';
const port = process.env.APP_PORT;

const update = () => {
    logger.info('Updating ip address');

    request({
            uri: `${etcd}/v2/keys/backends`,
            json: true,
        })
        .then((data) => data.node && data.node.dir)
        .catch(() => false)
        .then((exists) => exists || request({
                method: 'PUT',
                uri: `${etcd}/v2/keys/backends?dir=true`,
            })
            .catch((e) => request({
                uri: `${etcd}/v2/keys/backends`,
                json: true,
            }))
            .then((data) => data.node && data.node.dir)
        )
        .then(() => fs.readFile(hosts))
        .then((file) => file.toString()
                .split(/\r\n|\n/)
                .map((line) =>
                    line.replace(/\s\s+/, ' ')
                        .replace(/(#.*$)/, '')
                        .match(/^\s*([^\s]+)\s+(([^\s]+\s*)+)$/)
                )
                .filter((m) => m)
                .map((m) => [m[1], m[2].split(/\s+/)])
                .map((m) => m[1].indexOf(app) >= 0 && m[0])
                .find((a) => a)
        )
        .then(
            (address) => 
                address || Promise.reject(new Error('Failed to resolve app to address'))
        )
        .then((address) => port ? `${address}:${port}` : address)
        .then((host) => `http://${host}`)
        .then((target) => request({
                method: 'PUT',
                uri: `${etcd}/v2/keys/backends/${app}?value=${target}`,
                json: true,
            })
            .then((data) => {
                logger.info(
                    'Addres of',
                    data.node.key,
                    'has been updated to',
                    data.node.value,
                    'from',
                    data.prevNode && data.prevNode.value || null
                );
            })
        )
        .catch((e) => logger.error(e))
        ;
};

update();
setInterval(update, 1000 * 60 * 10);