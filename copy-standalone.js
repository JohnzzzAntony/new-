const fs = require('fs');
const path = require('path');

const copyRecursiveSync = function (src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(function (childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    if (exists) {
      fs.copyFileSync(src, dest);
    }
  }
};

const standalonePath = path.join(__dirname, '.next', 'standalone');

if (fs.existsSync(standalonePath)) {
  // Copy public folder
  const publicSrc = path.join(__dirname, 'public');
  const publicDest = path.join(standalonePath, 'public');
  if (fs.existsSync(publicSrc)) {
    copyRecursiveSync(publicSrc, publicDest);
    console.log('Copied public folder to standalone.');
  }

  // Copy .next/static folder
  const staticSrc = path.join(__dirname, '.next', 'static');
  const staticDest = path.join(standalonePath, '.next', 'static');
  if (fs.existsSync(staticSrc)) {
    copyRecursiveSync(staticSrc, staticDest);
    console.log('Copied .next/static folder to standalone.');
  }
} else {
  console.log('Standalone directory not found. Ensure output: "standalone" is set in next.config.ts');
  process.exit(1);
}
