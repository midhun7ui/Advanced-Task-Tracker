import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { auth, googleProvider } from '../../firebase/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import InteractiveRope from '../ThreeJS/InteractiveRope';
import '../../App.css'; 

class InteractiveRopeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.toString() };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'absolute', zIndex: 9999, background: 'rgba(255,0,0,0.8)', padding: '20px', color: 'white' }}>
          <h3>3D Physical Renderer Crash</h3>
          <p>{this.state.errorMsg}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg('');
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleManualAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        if (formData.name) {
          await updateProfile(userCred.user, { displayName: formData.name });
        }
      }
      navigate('/dashboard');
    } catch (err) {
      let userFriendlyMsg = "An unexpected error occurred. Please try again.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        userFriendlyMsg = "Incorrect email address or password. Please carefully try again.";
      } else if (err.code === 'auth/email-already-in-use') {
        userFriendlyMsg = "An account already exists with this email address! Please try logging in instead.";
      } else if (err.code === 'auth/weak-password') {
        userFriendlyMsg = "Password is too weak. Please use at least 6 characters.";
      } else if (err.code === 'auth/invalid-email') {
        userFriendlyMsg = "Please enter a valid email address format.";
      } else {
        userFriendlyMsg = err.message;
      }
      setErrorMsg(userFriendlyMsg);
      // Removed physical popup alert for better A11y/UX
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="auth-container" style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* Visual Brand Layer - Hidden from screen readers */}
      <div className="auth-branding-layer" aria-hidden="true" style={{ 
        flex: 1, 
        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '5vw', 
        color: 'white', 
        position: 'relative', 
        overflow: 'hidden',
        boxShadow: 'inset -20px 0 50px rgba(0,0,0,0.1)'
      }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(56,189,248,0) 70%)', borderRadius: '50%', filter: 'blur(80px)' }}></div>
        
        <InteractiveRopeErrorBoundary>
          <InteractiveRope />
        </InteractiveRopeErrorBoundary>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '600px', pointerEvents: 'none' }}>
          <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', marginBottom: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '800', color: '#cbd5e1', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.6))' }}>
            Next-Gen Dashboard
          </div>
          <h1 style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: '900', fontFamily: '"Outfit", sans-serif', lineHeight: '1.2', marginBottom: '24px', letterSpacing: '-0.03em', color: '#ffffff', textShadow: '0px 4px 20px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.9)' }}>
            Track your task
          </h1>
          <p style={{ fontSize: 'clamp(1.1rem, 1.5vw, 1.35rem)', fontWeight: '700', fontFamily: '"Outfit", sans-serif', lineHeight: '1.6', color: '#cbd5e1', textShadow: '0px 2px 10px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)' }}>
            With advanced and efficent graphs build with logic.
          </p>
        </div>
      </div>

      <main className="auth-interaction-layer" style={{ 
        flex: 1, 
        minWidth: '400px', 
        maxWidth: '650px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '40px', 
        background: 'var(--bg-primary)',
        position: 'relative',
        zIndex: 50
      }}>
        <div className="glass-panel" style={{ 
          width: '100%', 
          maxWidth: '460px', 
          padding: '48px', 
          borderRadius: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '28px', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#1a1b1e'
        }}>
          
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '-0.02em' }}>
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              {isLogin ? 'Sign in to access your dashboard' : 'Create an account to track your progress'}
            </p>
          </div>

          <div 
            aria-live="assertive" 
            style={{ 
              minHeight: errorMsg ? 'auto' : '0', 
              padding: errorMsg ? '14px' : '0',
              background: errorMsg ? 'rgba(239, 68, 68, 0.1)' : 'transparent', 
              color: '#ef4444', 
              border: errorMsg ? '1px solid rgba(239, 68, 68, 0.2)' : 'none', 
              borderRadius: '14px', 
              fontSize: '0.9rem', 
              textAlign: 'center', 
              fontWeight: '500' 
            }}
          >
            {errorMsg}
          </div>

          <form onSubmit={handleManualAuth} aria-busy={isLoading} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="auth-name" className="sr-only">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} aria-hidden="true" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input id="auth-name" type="text" name="name" placeholder="Full Name" required value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem', transition: 'all 0.2s' }} />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="auth-email" className="sr-only">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} aria-hidden="true" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input id="auth-email" type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem', transition: 'all 0.2s' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="auth-password" className="sr-only">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} aria-hidden="true" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input id="auth-password" type="password" name="password" placeholder="Password" required minLength="6" value={formData.password} onChange={handleChange} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem', transition: 'all 0.2s' }} />
              </div>
            </div>

            {!isLogin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="auth-confirm-password" className="sr-only">Retype Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} aria-hidden="true" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input id="auth-confirm-password" type="password" name="confirmPassword" placeholder="Retype Password" required minLength="6" value={formData.confirmPassword} onChange={handleChange} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem', transition: 'all 0.2s' }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: '600', fontSize: '1.05rem', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '12px', transition: 'all 0.2s', boxShadow: '0 8px 20px -6px rgba(59,130,246,0.4)', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" aria-hidden="true" /> <span>Securely Processing...</span>
                </>
              ) : isLogin ? <><LogIn size={20} aria-hidden="true" /> <span>Sign In</span></> : <><UserPlus size={20} aria-hidden="true" /> <span>Create Account</span></>}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }} aria-hidden="true">
            <div style={{ flex: 1, height: '2px', background: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 16px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>or connect via</span>
            <div style={{ flex: 1, height: '2px', background: 'var(--border-color)' }}></div>
          </div>

          <button onClick={handleGoogleSignIn} aria-label="Sign in with Google" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '14px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '700', background: 'none', border: 'none', padding: 0, font: 'inherit' }} 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Create Account' : 'Login instead'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;

