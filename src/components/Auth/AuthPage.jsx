import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { auth, googleProvider } from '../../firebase/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import InteractiveRope from '../ThreeJS/InteractiveRope';
import '../../App.css'; // Leverage existing glassmorphism theme

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
      // Map Google Firebase Auth exceptions into perfectly clean human-readable UI alerts
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
        userFriendlyMsg = err.message; // Fallback for rare tokens
      }
      
      // Update inline UI Red Text box
      setErrorMsg(userFriendlyMsg);
      
      // Throw physical popup window alert just to immediately grab user attention
      alert(userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* Visual Brand Layer - Deep Gradient with Abstract Glows */}
      <div className="auth-branding-layer" style={{ 
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
        {/* CSS Decoration Glows */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(56,189,248,0) 70%)', borderRadius: '50%', filter: 'blur(80px)' }}></div>
        
        {/* Render actual highly reactive 3D mathematical canvas below text layers unconditionally */}
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

      {/* Authentication Gateway Layer */}
      <div className="auth-interaction-layer" style={{ 
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
          background: '#1a1b1e' // Sleek, slightly elevated gray to pop from black
        }}>
          
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '-0.02em' }}>
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              {isLogin ? 'Sign in to access your dashboard' : 'Create an account to track your progress'}
            </p>
          </div>

          {errorMsg && (
            <div style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '14px', fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleManualAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="text" name="name" placeholder="Full Name" required value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem', transition: 'all 0.2s' }} />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem', transition: 'all 0.2s' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type="password" name="password" placeholder="Password" required minLength="6" value={formData.password} onChange={handleChange} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem', transition: 'all 0.2s' }} />
              </div>
            </div>

            {!isLogin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="password" name="confirmPassword" placeholder="Retype Password" required minLength="6" value={formData.confirmPassword} onChange={handleChange} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem', transition: 'all 0.2s' }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: '600', fontSize: '1.05rem', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '12px', transition: 'all 0.2s', boxShadow: '0 8px 20px -6px rgba(59,130,246,0.4)', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? (
                <>
                  <style>{`@keyframes spinLoader { 100% { transform: rotate(360deg); } } .spin-icon { animation: spinLoader 1s linear infinite; }`}</style>
                  <Loader2 size={20} className="spin-icon" /> Securely Processing...
                </>
              ) : isLogin ? <><LogIn size={20} /> Sign In</> : <><UserPlus size={20} /> Create Account</>}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 16px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>or connect via</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>

          <button onClick={handleGoogleSignIn} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '20px', background: 'white', padding: '4px', borderRadius: '4px' }}>G</span>
            Sign in with Google
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span 
              style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '700' }} 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Create Account' : 'Login instead'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
