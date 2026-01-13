module.exports = {
  apps: [
    {
      name: 'kfc-kiosk-3000',
      script: 'node',
      args: 'node_modules/next/dist/bin/next start -p 3000',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'kfc-kiosk-3001',
      script: 'node',
      args: 'node_modules/next/dist/bin/next start -p 3001',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'kfc-kiosk-3002',
      script: 'node',
      args: 'node_modules/next/dist/bin/next start -p 3002',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'load-balancer',
      script: 'lb.js',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
