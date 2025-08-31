const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enable CORS for all routes
app.use(cors({
    origin: '*',
    credentials: true
}));

// Proxy all requests to Roblox
app.use('/', createProxyMiddleware({
    target: 'https://accountsettings.roblox.com',
    changeOrigin: true,
    onProxyRes: function (proxyRes, req, res) {
        // Add CORS headers to all responses
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRF-TOKEN, Accept';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
