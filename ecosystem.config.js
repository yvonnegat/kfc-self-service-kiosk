module.exports = {
  apps: [{
    name: 'kfc-kiosk-3000',
    script: 'npx',
    args: 'next start --port 3000',
    instances: 1,
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'production'
    }
  }, {
    name: 'kfc-kiosk-3001',
    script: 'npx',
    args: 'next start --port 3001',
    instances: 1,
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'production'
    }
  }, {
    name: 'kfc-kiosk-3002',
    script: 'npx',
    args: 'next start --port 3002',
    instances: 1,
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'production'
    }
  }, {
    name: 'load-balancer',
    script: 'lb.js',
    instances: 1,
    cwd: process.cwd(),
    env: {
      NODE_ENV: 'production'
    }
  }]
};