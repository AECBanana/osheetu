import { NextResponse } from 'next/server';

// 验证NEXTAUTH_SECRET的有效性
function validateNextAuthSecret(secret: string | undefined): { valid: boolean; message: string } {
  if (!secret) {
    return { valid: false, message: 'NEXTAUTH_SECRET未设置' };
  }
  
  if (secret.length < 32) {
    return { valid: false, message: 'NEXTAUTH_SECRET长度应至少为32个字符' };
  }
  
  // 检查是否使用了默认值或不安全的值
  const commonWeakSecrets = ['changeme', 'your-secret-here', 'default-secret'];
  if (commonWeakSecrets.includes(secret.toLowerCase())) {
    return { valid: false, message: 'NEXTAUTH_SECRET使用了不安全的默认值' };
  }
  
  return { valid: true, message: 'NEXTAUTH_SECRET验证通过' };
}

// 验证NEXTAUTH_URL的有效性
function validateNextAuthUrl(url: string | undefined): { valid: boolean; message: string } {
  if (!url) {
    return { valid: false, message: 'NEXTAUTH_URL未设置' };
  }
  
  try {
    const parsedUrl = new URL(url);
    
    // 检查URL协议是否为http或https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, message: 'NEXTAUTH_URL协议必须是http或https' };
    }
    
    // 检查是否是有效的域名或IP地址
    if (!parsedUrl.hostname) {
      return { valid: false, message: 'NEXTAUTH_URL格式不正确，缺少主机名' };
    }
    
    return { valid: true, message: 'NEXTAUTH_URL验证通过' };
  } catch (error) {
    return { valid: false, message: `NEXTAUTH_URL格式无效: ${error instanceof Error ? error.message : '未知错误'}` };
  }
}

export async function GET() {
  try {
    // 定义需要检查的认证环境变量
    const authVars = {
      'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
      'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
      'OSU_CLIENT_ID': process.env.OSU_CLIENT_ID,
      'NEXT_PUBLIC_OSU_CLIENT_ID': process.env.NEXT_PUBLIC_OSU_CLIENT_ID,
      'OSU_CLIENT_SECRET': process.env.OSU_CLIENT_SECRET
    };
    
    // 检查是否有缺失的环境变量
    const missingVars = Object.entries(authVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
    
    // 验证关键环境变量的有效性
    const nextAuthSecretValidation = validateNextAuthSecret(process.env.NEXTAUTH_SECRET);
    const nextAuthUrlValidation = validateNextAuthUrl(process.env.NEXTAUTH_URL);
    
    // 检查OSU客户端ID是否匹配（前后端应该相同）
    const clientIdMatch = process.env.OSU_CLIENT_ID && 
                          process.env.NEXT_PUBLIC_OSU_CLIENT_ID &&
                          process.env.OSU_CLIENT_ID === process.env.NEXT_PUBLIC_OSU_CLIENT_ID;
    
    // 生成详细的验证结果
    const validationResults = {
      nextAuthSecret: nextAuthSecretValidation,
      nextAuthUrl: nextAuthUrlValidation,
      clientIdMatch: clientIdMatch || (process.env.OSU_CLIENT_ID && process.env.NEXT_PUBLIC_OSU_CLIENT_ID ? false : null),
      hasClientSecret: !!process.env.OSU_CLIENT_SECRET,
      missingVars: missingVars
    };
    
    // 确定整体验证是否通过
    const isSuccess = missingVars.length === 0 && 
                      nextAuthSecretValidation.valid && 
                      nextAuthUrlValidation.valid && 
                      (clientIdMatch || (process.env.OSU_CLIENT_ID === undefined && process.env.NEXT_PUBLIC_OSU_CLIENT_ID === undefined)) && 
                      !!process.env.OSU_CLIENT_SECRET;
    
    // 生成状态消息
    let statusMessage = '认证服务配置验证通过';
    if (!isSuccess) {
      const issues: string[] = [];
      
      if (missingVars.length > 0) {
        issues.push(`缺少环境变量: ${missingVars.join(', ')}`);
      }
      
      if (!nextAuthSecretValidation.valid) {
        issues.push(nextAuthSecretValidation.message);
      }
      
      if (!nextAuthUrlValidation.valid) {
        issues.push(nextAuthUrlValidation.message);
      }
      
      if (clientIdMatch === false) {
        issues.push('OSU_CLIENT_ID和NEXT_PUBLIC_OSU_CLIENT_ID不匹配');
      }
      
      if (!process.env.OSU_CLIENT_SECRET) {
        issues.push('OSU_CLIENT_SECRET未设置');
      }
      
      statusMessage = `认证服务配置验证失败: ${issues.join('; ')}`;
    }
    
    console.log('认证服务配置测试结果:', {
      success: isSuccess,
      issues: isSuccess ? [] : validationResults,
      timestamp: new Date().toISOString()
    });
    
    // 返回验证结果（注意不要暴露敏感信息）
    return NextResponse.json({
      success: isSuccess,
      message: statusMessage,
      validationResults: {
        nextAuthSecret: {
          exists: !!process.env.NEXTAUTH_SECRET,
          valid: nextAuthSecretValidation.valid,
          message: nextAuthSecretValidation.message
        },
        nextAuthUrl: {
          exists: !!process.env.NEXTAUTH_URL,
          valid: nextAuthUrlValidation.valid,
          message: nextAuthUrlValidation.message,
          value: process.env.NEXTAUTH_URL
        },
        clientIdConfig: {
          serverClientIdExists: !!process.env.OSU_CLIENT_ID,
          publicClientIdExists: !!process.env.NEXT_PUBLIC_OSU_CLIENT_ID,
          match: clientIdMatch
        },
        clientSecretExists: !!process.env.OSU_CLIENT_SECRET,
        missingVars: missingVars
      },
      timestamp: new Date().toISOString(),
      // 提供额外的排查建议
      troubleshootingTips: isSuccess ? [] : [
        '请确保在Vercel控制台正确设置了所有认证相关的环境变量',
        'NEXTAUTH_SECRET应至少32个字符，建议使用随机生成的字符串',
        'NEXTAUTH_URL应设置为您的应用域名，格式为https://your-domain.com',
        'OSU_CLIENT_ID和NEXT_PUBLIC_OSU_CLIENT_ID的值应该相同',
        'OSU_CLIENT_SECRET是敏感信息，不要在前端代码中暴露'
      ]
    }, { status: isSuccess ? 200 : 400 });
  } catch (error) {
    console.error('认证服务配置测试过程中发生异常:', error);
    return NextResponse.json({
      success: false,
      message: `认证服务配置测试异常: ${error instanceof Error ? error.message : '未知错误'}`,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}