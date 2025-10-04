"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Title1,
  Body1,
  Spinner,
  makeStyles,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});

function AuthHandlerComponent() {
  const styles = useStyles();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !isLoggingIn) {
      setIsLoggingIn(true);
      signIn('osu', { code, redirect: false })
        .then((result) => {
          if (result?.ok) {
            router.replace('/', undefined);
          } else {
            console.error('登录失败:', result?.error);
            alert(`登录失败: ${result?.error || '未知错误'}`);
            router.replace('/', undefined);
          }
        })
        .catch(err => {
          console.error('登录过程中发生意外错误:', err);
          alert('登录过程中发生意外错误，请查看控制台');
          router.replace('/', undefined);
        })
        .finally(() => {
          // The redirect will trigger a re-render, no need to setIsLoggingIn(false)
        });
    }
  }, [searchParams, router, isLoggingIn]);

  if (isLoggingIn) {
    return (
      <div className={styles.loadingOverlay}>
        <Spinner size="huge" />
        <Title1 style={{ marginTop: '20px' }}>正在完成登录...</Title1>
        <Body1>请稍候，正在为您创建会话。</Body1>
      </div>
    );
  }

  return null;
}

export function AuthHandler() {
  return (
    <Suspense fallback={null}>
      <AuthHandlerComponent />
    </Suspense>
  );
}
