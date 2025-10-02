import { NextResponse } from 'next/server';

export async function GET() {
  // 检查重要的环境变量是否存在（注意：不要在响应中暴露敏感值）
  const envVarsStatus = {
    // 服务器端环境变量检查
    serverVars: {
      hasOsuClientId: !!process.env.OSU_CLIENT_ID,
      hasOsuClientSecret: !!process.env.OSU_CLIENT_SECRET,
      hasDbHost: !!process.env.DB_HOST,
      hasDbUser: !!process.env.DB_USER,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    },
    // 客户端环境变量检查
    clientVars: {
      hasNextPublicOsuClientId: !!process.env.NEXT_PUBLIC_OSU_CLIENT_ID,
    },
    // 部署信息
    deploymentInfo: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercelUrl: process.env.VERCEL_URL,
    }
  };

  // 将详细信息记录到服务器日志（仅在服务器端可见）
  console.log('环境变量测试结果:', envVarsStatus);

  // 检查是否有缺失的关键环境变量
  const missingServerVars = Object.entries(envVarsStatus.serverVars)
    .filter(([_, exists]) => !exists)
    .map(([varName, _]) => varName.replace('has', '').replace(/([A-Z])/g, ' $1').trim());

  const missingClientVars = Object.entries(envVarsStatus.clientVars)
    .filter(([_, exists]) => !exists)
    .map(([varName, _]) => varName.replace('has', '').replace(/([A-Z])/g, ' $1').trim());

  // 生成状态消息
  let statusMessage = '所有环境变量已正确配置！';
  let isSuccess = true;

  if (missingServerVars.length > 0 || missingClientVars.length > 0) {
    isSuccess = false;
    statusMessage = '缺少以下环境变量：';
    
    if (missingServerVars.length > 0) {
      statusMessage += `\n- 服务器端变量: ${missingServerVars.join(', ')}`;
    }
    
    if (missingClientVars.length > 0) {
      statusMessage += `\n- 客户端变量: ${missingClientVars.join(', ')}`;
    }
    
    statusMessage += '\n请在Vercel控制台中添加缺失的环境变量后重新部署。';
  }

  return NextResponse.json({
    success: isSuccess,
    message: statusMessage,
    deploymentInfo: envVarsStatus.deploymentInfo,
    // 注意：不要在客户端响应中暴露敏感的环境变量值
    // 只返回哪些变量存在，不返回具体值
    hasAllRequiredVars: isSuccess
  });
}