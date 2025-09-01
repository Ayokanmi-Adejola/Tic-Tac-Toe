import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname } from 'path';

const port = 8000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json'
};

const server = createServer((req, res) => {
  let filePath = req.url === '/' ? '/tic-tac-toe.html' : req.url;
  
  // Remove query parameters
  filePath = filePath.split('?')[0];
  
  // Remove leading slash
  filePath = filePath.substring(1);
  
  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});