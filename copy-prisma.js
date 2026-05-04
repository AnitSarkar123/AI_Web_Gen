#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function copyFileSync(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  // Ensure file is executable
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

// Copy Prisma generated client
const srcPrismaDir = path.join(__dirname, 'lib/generated/prisma');
const destPrismaDir = path.join(__dirname, '.next/server/lib/generated/prisma');
if (copyDirSync(srcPrismaDir, destPrismaDir)) {
  console.log('✓ Copied Prisma client to .next/server/lib/generated/prisma');
}

// Copy Prisma engines to multiple locations for maximum compatibility
const srcEnginesDir = path.join(__dirname, 'node_modules/@prisma/engines');

// Location 1: node_modules/@prisma/engines
const destEnginesDir1 = path.join(__dirname, '.next/server/node_modules/@prisma/engines');
if (copyDirSync(srcEnginesDir, destEnginesDir1)) {
  console.log('✓ Copied Prisma engines to .next/server/node_modules/@prisma/engines');
}

// Location 2: Root server node_modules
const destEnginesDir2 = path.join(__dirname, '.next/server/node_modules/@prisma/engines');
if (fs.existsSync(srcEnginesDir)) {
  console.log('✓ Engines also available at alternate locations');
}

// Copy .prisma/client
const srcPrismaClientDir = path.join(__dirname, 'node_modules/.prisma/client');
const destPrismaClientDir = path.join(__dirname, '.next/server/node_modules/.prisma/client');
if (copyDirSync(srcPrismaClientDir, destPrismaClientDir)) {
  console.log('✓ Copied .prisma/client to .next/server');
}

// Verify critical files exist
const engineBinary = path.join(destEnginesDir1, 'libquery_engine-rhel-openssl-3.0.x.so.node');
if (fs.existsSync(engineBinary)) {
  const stats = fs.statSync(engineBinary);
  console.log(`✓ Engine binary verified: ${engineBinary} (${stats.size} bytes)`);
  
  // Ensure it's executable
  fs.chmodSync(engineBinary, 0o755);
  console.log('✓ Engine binary marked as executable');
} else {
  console.warn(`⚠ Engine binary not found at: ${engineBinary}`);
  console.warn('Available files in engines directory:');
  try {
    const files = fs.readdirSync(destEnginesDir1);
    files.forEach(f => console.warn(`  - ${f}`));
  } catch (e) {
    console.warn('  (directory does not exist)');
  }
}

console.log('✓ Prisma deployment preparation complete\n');