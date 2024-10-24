import net from 'node:net';
import debug from 'debug';

debug.enable('*');

//check if nut server is up
await new Promise((resolve, reject) => {
    const client = net.createConnection(3493, '127.0.0.1', () => {
        resolve();
        client.end();
    });

    client.on('error', (err) => {
        reject(err);
        client.end();
    });
});
