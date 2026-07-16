import React, { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import { Sound } from '../../components/SoundController';
import { ShieldAlert, Cpu, KeyRound } from 'lucide-react';

export const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [initialized, setInitialized] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if security database is initialized
    authService.checkSetupStatus()
      .then(data => {
        setInitialized(data.initialized);
        if (!data.initialized) {
          // Play warning sound denoting uninitialized setup portal
          Sound.playWarning();
        } else {
          Sound.playWarning();
        }
      })
      .catch(() => {
        // Fallback to warning sound anyway
        Sound.playWarning();
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);
    Sound.playClick();

    if (!initialized) {
      // First-time setup flow
      if (password !== confirmPassword) {
        setLoading(false);
        setError('SECURITY CONFLICT: Access keys do not match.');
        Sound.playWarning();
        return;
      }

      const res = await authService.setup(password);
      setLoading(false);
      if (res.success) {
        setPassword('');
        setConfirmPassword('');
        window.location.hash = '#/admin';
      } else {
        setError(res.error || 'INITIALIZATION FAILED');
        Sound.playWarning();
      }
    } else {
      // Standard login flow
      const res = await authService.login(password);
      setLoading(false);

      if (res.success) {
        setPassword('');
        window.location.hash = '#/admin';
      } else {
        setError(res.error || 'SECURITY ACCESS VIOLATION');
        setPassword('');
        
        // Play procedure alarm sound sequence
        Sound.playWarning();
        setTimeout(() => Sound.playWarning(), 150);
        setTimeout(() => Sound.playWarning(), 300);
      }
    }
  };

  return (
    <div 
      style={{
        display: 'flex', 
        height: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: 'var(--nier-bg)', 
        color: 'var(--nier-text)',
        padding: '20px'
      }}
    >
      <div 
        className="nier-panel" 
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '30px',
          border: error ? '2px solid var(--nier-accent)' : '2px solid var(--nier-border)',
          backgroundColor: 'var(--nier-bg)',
          boxShadow: '8px 8px 0px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          animation: error ? 'glitch 0.2s ease infinite' : 'none'
        }}
      >
        {/* Terminal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--nier-border-muted)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--nier-text-muted)' }}>
            {initialized ? <Cpu size={14} /> : <KeyRound size={14} />}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.05em' }}>
              {initialized ? 'SECURE_ACCESS_PORTAL // v1.0.9' : 'SYSTEM_CREATION_PORTAL // INITIALIZE'}
            </span>
          </div>
          <span style={{ color: initialized ? 'var(--nier-accent)' : 'var(--nier-border-muted)', fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
            {initialized ? 'RESTRICTED' : 'UNINITIALIZED'}
          </span>
        </div>

        {/* Security Warning / Welcome message */}
        <div 
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.03)', 
            padding: '12px', 
            borderLeft: '4px solid var(--nier-border)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            lineHeight: '1.5'
          }}
        >
          {initialized 
            ? '> WARNING: Administrative privileges required. Unauthorized connection attempts will be logged and reported to YoRHa command immediately.'
            : '> SETUP REQUIRED: Master authorization key not yet registered. Input a secure access key to register your administrative terminal.'}
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>
              {initialized ? 'INPUT ACCESS AUTHORIZATION KEY:' : 'CREATE ACCESS KEY (MIN 6 CHARACTERS):'}
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••••••••"
              autoFocus
              style={{
                backgroundColor: 'rgba(0,0,0,0.03)',
                border: error ? '1px solid var(--nier-accent)' : '1px solid var(--nier-border)',
                color: 'var(--nier-text)',
                padding: '10px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                letterSpacing: '0.2em',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {!initialized && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--nier-text-muted)' }}>
                CONFIRM ACCESS KEY:
              </label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••••••••"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  border: error ? '1px solid var(--nier-accent)' : '1px solid var(--nier-border)',
                  color: 'var(--nier-text)',
                  padding: '10px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  letterSpacing: '0.2em',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Action buttons */}
          <button 
            type="submit" 
            disabled={loading || !password || (!initialized && !confirmPassword)}
            style={{
              padding: '10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              width: '100%',
              backgroundColor: 'transparent',
              border: error ? '1px solid var(--nier-accent)' : '1px solid var(--nier-border)',
              color: error ? 'var(--nier-accent)' : 'var(--nier-text)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {initialized 
              ? (loading ? '[ AUTHORIZING... ]' : '[ INITIATE SYSTEM DECRYPT ]')
              : (loading ? '[ INITIALIZING DATABASE... ]' : '[ REGISTER MASTER ACCESS KEY ]')}
          </button>
        </form>

        {/* Security rejection messages */}
        {error && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              color: 'var(--nier-accent)', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '11px',
              backgroundColor: 'var(--nier-accent-dim)',
              padding: '10px',
              border: '1px solid var(--nier-accent)'
            }}
          >
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default Login;
