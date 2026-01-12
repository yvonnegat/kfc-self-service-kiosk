const httpProxy = require('http-proxy');
const http = require('http');

const servers = [
  { host: 'localhost', port: 3000 },
  { host: 'localhost', port: 3001 },
  { host: 'localhost', port: 3002 }
];

let currentServer = 0;

const proxy = httpProxy.createProxyServer({});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  // Try the next server
  currentServer = (currentServer + 1) % servers.length;
  const nextTarget = servers[currentServer];
  console.log(`Retrying with ${nextTarget.host}:${nextTarget.port}`);
  proxy.web(req, res, { target: `http://${nextTarget.host}:${nextTarget.port}` });
});

const server = http.createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Load Balancer Status',
      servers: servers,
      currentServer: currentServer,
      timestamp: new Date().toISOString()
    }));
  } else {
    const target = servers[currentServer];
    currentServer = (currentServer + 1) % servers.length;

    console.log(`Proxying to ${target.host}:${target.port}`);

    proxy.web(req, res, { target: `http://${target.host}:${target.port}` });
  }
});

server.listen(8080, () => {
  console.log('Load balancer running on port 8080');
  console.log('Status page available at http://localhost:8080/status');
});