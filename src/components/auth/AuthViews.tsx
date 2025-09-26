import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type AuthView = 'login' | 'register' | 'forgot-password';

export function AuthViews() {
  const [authView, setAuthView] = useState<AuthView>('login');

  switch (authView) {
    case 'register':
      return <RegisterForm onToggleLogin={() => setAuthView('login')} />;
    case 'forgot-password':
      return <ForgotPasswordForm onBack={() => setAuthView('login')} />;
    default:
      return (
        <LoginForm 
          onToggleRegister={() => setAuthView('register')}
          onForgotPassword={() => setAuthView('forgot-password')}
        />
      );
  }
}