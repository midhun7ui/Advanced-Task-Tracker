import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Moon, Sun, LogOut, Loader2, User as UserIcon } from 'lucide-react';
import './App.css';
import GraphicalView from './components/ThreeJS/GraphicalView';
import TaskTable from './components/Tasks/TaskTable';
import AuthPage from './components/Auth/AuthPage';

import { auth, db } from './firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

const Dashboard = ({ isDark, setIsDark }) => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      try {
        // Fetch Categories natively isolated by UID
        const qCat = query(collection(db, 'categories'), where("userId", "==", currentUser.uid));
        const catSnap = await getDocs(qCat);
        let catData = catSnap.docs.map(d => d.data().name);

        // Auto-seed initial Categories locally into Firestore if it's a completely fresh user
        if (catData.length === 0) {
          const defaultCats = ['Design', 'Development', 'Backend', 'Marketing', 'Research'];
          for (let name of defaultCats) {
            // Document ID structure guarantees unique category sets per user without collisions
            await setDoc(doc(db, 'categories', `${currentUser.uid}_${name}`), { name, userId: currentUser.uid });
          }
          catData = defaultCats;
        }
        setCategories(catData);

        // Native Task fetch
        const qTask = query(collection(db, 'tasks'), where("userId", "==", currentUser.uid));
        const taskSnap = await getDocs(qTask);
        const taskData = taskSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Ensure accurate tracking synchronization
        setTasks(taskData);
      } catch (err) {
        console.error("Firestore real-time sync error:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good morning', icon: '☀️' };
    if (hour >= 12 && hour < 17) return { text: 'Good afternoon', icon: '🌤️' };
    if (hour >= 17 && hour < 21) return { text: 'Good evening', icon: '🌇' };
    return { text: 'Good night', icon: '🌙' };
  };

  const greeting = getGreeting();

  return (
    <div className="app-container">
      <header className="header glass-panel">
        <div className="title-container">
          <LayoutDashboard className="title-icon" size={28} />
          <h1>{greeting.text} <span className="greeting-emoji">{greeting.icon}</span>, {user?.displayName || user?.email?.split('@')[0] || 'User'}</h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              referrerPolicy="no-referrer"
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} 
              title={user?.email} 
            />
          ) : (
            <div 
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} 
              title={user?.email}
            >
              <UserIcon size={18} />
            </div>
          )}
          <button className="theme-toggle-btn" onClick={() => setIsDark(!isDark)} title="Toggle theme">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', cursor: 'pointer' }}
            onClick={async () => { await signOut(auth); navigate('/login'); }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>
      <main className="main-content">
        <GraphicalView tasks={tasks} categories={categories} />
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <style>{`@keyframes spinLoader { 100% { transform: rotate(360deg); } } .spin-icon { animation: spinLoader 1s linear infinite; }`}</style>
            <Loader2 size={36} className="spin-icon" style={{ color: 'var(--accent)' }}/>
            <span style={{ fontSize: '1.2rem', fontWeight: '500' }}>Syncing Secure Database...</span>
          </div>
        ) : (
          <TaskTable tasks={tasks} setTasks={setTasks} categories={categories} setCategories={setCategories} />
        )}
      </main>
    </div>
  );
};

function App() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }, [isDark]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/dashboard" element={<Dashboard isDark={isDark} setIsDark={setIsDark} />} />
    </Routes>
  );
}

export default App;
