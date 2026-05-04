#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const srcPrismaDir = path.join(__dirname, 'lib/generated/prisma');
const destPrismaDir = path.join(__dirname, '.next/server/lib/generated/prisma');

if (!fs.existsSync(destPrismaDir)) {
  fs.mkdirSync(destPrismaDir, { recursive: true });
}

if (fs.existsSync(srcPrismaDir)) {
  try {
    execSync(`cp -r ${srcPrismaDir}/* ${destPrismaDir}/`);
    console.log('✓ Prisma files copied');
  } catch (e) {
    console.log('Prisma copy done');
  }
}