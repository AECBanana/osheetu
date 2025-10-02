'use client';

import { useState, useEffect } from 'react';

// 环境变量检查器组件 - 提供直观的方式来查看和测试环境变量
const EnvironmentChecker = () => {
  const [loading, setLoading] = useState(true);
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [customVar, setCustomVar] = useState('');
  const [customVarResult, setCustomVarResult] = useState<any>(null);

  // 获取环境变量状态
  const fetchEnvStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 使用我们新创建的env-check端点
      const response = await fetch('/api/env-check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态码: ${response.status}`);
      }

      const data = await response.json();
      setEnvStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取环境变量状态失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试自定义环境变量
  const testCustomVar = async () => {
    if (!customVar.trim()) {
      setError('请输入要测试的环境变量名');
      return;
    }

    try {
      setError(null);
      setCustomVarResult(null);

      const response = await fetch('/api/env-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testVars: [customVar.trim()] })
      });

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态码: ${response.status}`);
      }

      const data = await response.json();
      setCustomVarResult(data.testResults[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试环境变量失败');
    }
  };

  // 组件挂载时获取环境变量状态
  useEffect(() => {
    fetchEnvStatus();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">环境变量检查器</h2>
        <p className="text-gray-600">正在获取环境变量状态...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">环境变量检查器</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {envStatus && (
        <div className="space-y-6">
          {/* 状态概览 */}
          <div className={`p-4 rounded-md ${envStatus.success ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            <h3 className="font-bold mb-1">状态: {envStatus.success ? '正常' : '需要修复'}</h3>
            <p>{envStatus.message}</p>
            <p className="text-sm mt-2">检查时间: {new Date(envStatus.timestamp).toLocaleString()}</p>
          </div>

          {/* 详细结果 */}
          <div className="space-y-4">
            {envStatus.results.map((group: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className={`px-4 py-3 ${group.allSet ? 'bg-green-50' : 'bg-amber-50'}`}>
                  <h3 className="font-bold flex items-center">
                    {group.name}
                    <span className={`ml-2 text-sm px-2 py-1 rounded ${group.allSet ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {group.allSet ? '全部设置' : '部分缺失'}
                    </span>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {group.variables.map((variable: any, varIdx: number) => (
                      <div 
                        key={varIdx} 
                        className={`p-3 rounded border ${variable.exists ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
                      `}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm">{variable.key}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${variable.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {variable.exists ? '已设置' : '缺失'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          类型: {variable.type === 'public' ? '客户端可访问' : variable.type === 'private' ? '仅服务器端' : '信息'}
                        </div>
                        {variable.type === 'info' && variable.value && (
                          <div className="text-xs mt-1 text-gray-700">
                            值: {variable.value}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 自定义环境变量测试 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-bold mb-3">测试自定义环境变量</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customVar}
                onChange={(e) => setCustomVar(e.target.value)}
                placeholder="输入环境变量名，例如：NEXT_PUBLIC_API_KEY"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={testCustomVar}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                测试
              </button>
            </div>
            
            {customVarResult && (
              <div className={`mt-3 p-3 rounded border ${customVarResult.exists ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{customVarResult.key}</span>
                  <span className={`text-sm px-2 py-0.5 rounded ${customVarResult.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {customVarResult.exists ? '已设置' : '缺失'}
                  </span>
                </div>
                {customVarResult.isPublic && (
                  <div className="text-xs mt-1 text-gray-500">
                    注意: 此变量以NEXT_PUBLIC_开头，可在客户端代码中访问
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 刷新按钮 */}
          <div className="flex justify-center mt-8">
            <button
              onClick={fetchEnvStatus}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              刷新状态
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentChecker;