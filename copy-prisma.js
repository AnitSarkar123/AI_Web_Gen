#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function copyFileSync(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, 0o755);
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠ Source not found: ${src}`);
    return false;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    const stats = fs.statSync(srcPath);
    if (stats.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  });

  return true;
}

console.log('🔄 Preparing Prisma deployment files...');

const srcPrismaDir = path.join(__dirname, 'lib/generated/prisma');
const srcEnginesDir = path.join(__dirname, 'node_modules/@prisma/engines');

// Primary location: .next/server
const destPrismaDir = path.join(__dirname, '.next/server/lib/generated/prisma');
const destEnginesDir = path.join(__dirname, '.next/server/node_modules/@prisma/engines');

if (copyDirSync(srcPrismaDir, destPrismaDir)) {
  console.log('✓ Copied Prisma client to .next/server/lib/generated/prisma');
}

if (copyDirSync(srcEnginesDir, destEnginesDir)) {
  console.log('✓ Copied Prisma engines to .next/server/node_modules/@prisma/engines');
  
  // Find and verify engine binary
  const engineBinary = path.join(destEnginesDir, 'libquery_engine-rhel-openssl-3.0.x.so.node');
  if (fs.existsSync(engineBinary)) {
    const stats = fs.statSync(engineBinary);
    console.log(`✓ Engine binary found: libquery_engine-rhel-openssl-3.0.x.so.node (${stats.size} bytes)`);
    fs.chmodSync(engineBinary, 0o755);
    console.log('✓ Engine binary marked as executable');
  }
}

// Also copy to .next root for serverless compatibility
const destEnginesRoot = path.join(__dirname, '.next/@prisma/engines');
if (copyDirSync(srcEnginesDir, destEnginesRoot)) {
  console.log('✓ Copied engines to .next/@prisma/engines (serverless location)');
}

console.log('✓ Prisma deployment preparation complete\n');