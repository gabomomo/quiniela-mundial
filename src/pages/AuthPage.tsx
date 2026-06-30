import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { AVATAR_EMOJIS } from '../data/worldcup2026';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [avatar, setAvatar] = useState(AVATAR_EMOJIS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const pinStr = pin.join('');
    if (pinStr.length !== 4) {
      setError('Ingresa los 4 dígitos del PIN');
      return;
    }
    setLoading(true);
    const result = mode === 'login'
      ? await login(email, pinStr)
      : await register(name, email, pinStr, avatar);
    setLoading(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-3xl font-black text-white">Quiniela</h1>
          <p className="text-blue-300 font-semibold text-lg">Mundial 2026</p>
          <p className="text-white/40 text-sm mt-1">USA · Canada · Mexico</p>
        </div>

        <div className="card p-6">
          {/* Registro oculto — solo inicio de sesión */}
          <h2 className="text-center text-white font-bold text-lg mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-white/60 text-sm font-medium mb-1.5 block">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm font-medium mb-1.5 block">Tu Avatar</label>
                  <div className="grid grid-cols-10 gap-2">
                    {AVATAR_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatar(emoji)}
                        className={`text-2xl p-1 rounded-lg transition-all ${avatar === emoji ? 'bg-blue-600 scale-110' : 'bg-white/10 hover:bg-white/20'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-white/60 text-sm font-medium mb-1.5 block">Correo</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="text-white/60 text-sm font-medium mb-1.5 block">PIN (4 dígitos)</label>
              <div className="flex gap-3 justify-center">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={pinRefs[i]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinChange(i, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(i, e)}
                    className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 transition-all"
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Desarrollado por{' '}
          <a href="https://momo.cr" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">
            Momo Studios
          </a>
        </p>
      </div>
    </div>
  );
}
