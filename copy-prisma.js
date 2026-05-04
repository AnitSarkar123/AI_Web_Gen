#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  try {
    if (process.platform === 'win32') {
      execSync(`xcopy "${src}" "${dest}" /E /I /Y`, { stdio: 'inherit' });
    } else {
      execSync(`cp -r "${src}"/* "${dest}"/`, { stdio: 'inherit' });
    }
    return true;
  } catch (e) {
    console.error(`Error copying ${src} to ${dest}:`, e.message);
    return false;
  }
}

console.log('🔄 Preparing Prisma deployment files...');

// Copy Prisma generated client
const srcPrismaDir = path.join(__dirname, 'lib/generated/prisma');
const destPrismaDir = path.join(__dirname, '.next/server/lib/generated/prisma');
if (copyDir(srcPrismaDir, destPrismaDir)) {
  console.log('✓ Copied Prisma client to .next/server');
}

// Copy Prisma engines
const srcEnginesDir = path.join(__dirname, 'node_modules/@prisma/engines');
const destEnginesDir = path.join(__dirname, '.next/server/node_modules/@prisma/engines');
if (copyDir(srcEnginesDir, destEnginesDir)) {
  console.log('✓ Copied Prisma engines to .next/server');
}

// Copy .prisma/client
const srcPrismaClientDir = path.join(__dirname, 'node_modules/.prisma/client');
const destPrismaClientDir = path.join(__dirname, '.next/server/node_modules/.prisma/client');
if (copyDir(srcPrismaClientDir, destPrismaClientDir)) {
  console.log('✓ Copied .prisma/client to .next/server');
}

// Also ensure files are accessible at root for serverless functions
const rootEnginesDir = path.join(__dirname, '.next/server/@prisma/engines');
if (copyDir(srcEnginesDir, rootEnginesDir)) {
  console.log('✓ Copied engines to alternate location');
}

console.log('✓ Prisma deployment preparation complete');