import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Player } from '../types';

interface AuthContextType {
  player: Player | null;
  loading: boolean;
  login: (email: string, pin: string) => Promise<{ error: string | null }>;
  register: (name: string, email: string, pin: string, avatar: string) => Promise<{ error: string | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('quiniela_player');
    if (stored) {
      try {
        setPlayer(JSON.parse(stored));
      } catch {
        localStorage.removeItem('quiniela_player');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pin: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('pin', pin)
      .single();

    if (error || !data) {
      return { error: 'Correo o PIN incorrecto' };
    }

    setPlayer(data);
    localStorage.setItem('quiniela_player', JSON.stringify(data));
    return { error: null };
  };

  const register = async (name: string, email: string, pin: string, avatar: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.toLowerCase().trim();

    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('email', cleanEmail)
      .single();

    if (existing) {
      return { error: 'Este correo ya está registrado' };
    }

    const { data, error } = await supabase
      .from('players')
      .insert({ name: name.trim(), email: cleanEmail, pin, avatar_emoji: avatar })
      .select()
      .single();

    if (error || !data) {
      return { error: 'Error al registrar. Intenta de nuevo.' };
    }

    setPlayer(data);
    localStorage.setItem('quiniela_player', JSON.stringify(data));
    return { error: null };
  };

  const logout = () => {
    setPlayer(null);
    localStorage.removeItem('quiniela_player');
  };

  return (
    <AuthContext.Provider value={{ player, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
