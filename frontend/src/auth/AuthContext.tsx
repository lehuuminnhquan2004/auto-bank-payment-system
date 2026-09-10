import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { apiClient } from '../api/client';
import type {
  LoginResponse,
  User,
} from '../types/auth';

import {AUTH_UNAUTHORIZED_EVENT} from './events';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;

  refreshUser: () => Promise<void>;
};


const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );

type AuthProviderProps = {
  children: ReactNode;
};


export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);
  

  //Tai lai trong tin nguoi dung
  const refreshUser =
    useCallback(async () => {
      const response =
        await apiClient.get<User>(
          '/auth/me',
        );

      setUser(response.data);
    }, []);

  //Xoa nguoi dung khi co su kien unauthorized
  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
    }

    window.addEventListener(
      AUTH_UNAUTHORIZED_EVENT,
      handleUnauthorized,
    );

    return () => {
      window.removeEventListener(
        AUTH_UNAUTHORIZED_EVENT,
        handleUnauthorized,
      );
    };
  }, []);
  
  useEffect(() => {
    async function loadUser() {
      const token =
        localStorage.getItem(
          'accessToken',
        );

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch {
        localStorage.removeItem(
          'accessToken',
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
  }, []);

  async function login(
    email: string,
    password: string,
  ) {
    const response =
      await apiClient.post<LoginResponse>(
        '/auth/login',
        {
          email,
          password,
        },
      );

    localStorage.setItem(
      'accessToken',
      response.data.accessToken,
    );
    try{
      await refreshUser();
    }catch(error){
      localStorage.removeItem(
        'accessToken',
      );
      setUser(null);

      throw error;
    }
    
  }

  function logout() {
    localStorage.removeItem(
      'accessToken',
    );

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider',
    );
  }

  return context;
}