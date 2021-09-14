const express = require('express');
const http = require('http');

const { resolve } = require('path');
const isTest = process.argv.indexOf('-t') !== -1;

const resApp = n => resolve(resolve(__dirname, '..'), n);
const { name } = require(resApp('package.json'));
const staticRoot = resApp('src');

const app = express();

const createServer = (options, handler) => {
  return http.createServer({ ...options}, handler);
};

app.use(express.static(staticRoot));
app.use((req, res) => {
  res.sendFile(resolve(staticRoot, 'index.html'));
});

const server = createServer({}, app);
const port = process.env.PORT || 3000;

!isTest && server.listen(port, () => console.log(`${name} listening at 'http://localhost:${port}`));
