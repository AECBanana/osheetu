#!/usr/bin/env node

/**
 * Vercel 环境变量检查脚本
 * 在构建前执行 `vercel env ls` 命令，验证环境变量是否正确配置
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== 构建前 Vercel 环境变量检查 ===\n');

try {
  // 检查是否安装了 Vercel CLI
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    console.log('✅ Vercel CLI 已安装');
  } catch (error) {
    console.error('❌ 错误: 未安装 Vercel CLI');
    console.error('请运行以下命令安装 Vercel CLI:');
    console.error('npm install -g vercel');
    process.exit(1);
  }

  // 检查是否已登录 Vercel
  try {
    const whoami = execSync('vercel whoami', { encoding: 'utf8' });
    console.log(`✅ 已登录 Vercel 账号: ${whoami.trim()}`);
  } catch (error) {
    console.error('❌ 错误: 未登录 Vercel');
    console.error('请运行以下命令登录 Vercel:');
    console.error('vercel login');
    process.exit(1);
  }

  // 检查是否已链接项目
  const hasVercelConfig = fs.existsSync(path.join(process.cwd(), '.vercel'));
  if (hasVercelConfig) {
    console.log('✅ 项目已链接到 Vercel');
  } else {
    console.log('ℹ️  项目尚未链接到 Vercel，正在尝试链接...');
    try {
      execSync('vercel link --yes', { stdio: 'inherit' });
      console.log('✅ 项目已成功链接到 Vercel');
    } catch (error) {
      console.error('❌ 错误: 项目链接失败');
      console.error('请手动运行 `vercel link` 命令链接项目');
      process.exit(1);
    }
  }

  // 执行 vercel env ls 命令查看环境变量
  console.log('\n=== 当前项目的 Vercel 环境变量 ===');
  execSync('vercel env ls', { stdio: 'inherit' });

  // 提示用户检查重要的环境变量
  console.log('\n=== 环境变量检查完成 ===');
  console.log('请确认以下关键环境变量已正确设置:');
  console.log('  ✓ NEXTAUTH_SECRET');
  console.log('  ✓ NEXTAUTH_URL');
  console.log('  ✓ NEXT_PUBLIC_OSU_CLIENT_ID');
  console.log('  ✓ OSU_CLIENT_ID');
  console.log('  ✓ OSU_CLIENT_SECRET');
  console.log('  ✓ DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
  console.log('\n如果有缺失的环境变量，请运行以下命令添加:');
  console.log('vercel env add <变量名>');
  console.log('\n构建过程将继续...\n');

  process.exit(0);

} catch (error) {
  console.error('\n❌ 环境变量检查过程中发生错误:', error.message);
  console.error('请解决上述问题后再尝试构建项目');
  process.exit(1);
}