import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAdminOrManager: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch or create user profile in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const profile = { id: userSnap.id, ...userSnap.data() } as User;
          if (profile.role === 'blocked') {
            await auth.signOut();
            setUserProfile(null);
            alert('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
          } else {
            setUserProfile(profile);
          }
        } else {
          // If first user, make admin for testing, else sales
          const isAdmin = user.email?.includes('admin') || user.email?.includes('stv344');
          const newUser: Omit<User, 'id'> = {
            email: user.email || '',
            name: user.displayName || 'Unknown',
            role: isAdmin ? 'admin' : 'sales',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newUser);
          setUserProfile({ id: user.uid, ...newUser } as User);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = () => auth.signOut();

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    logout,
    isAdminOrManager: userProfile?.role === 'admin' || userProfile?.role === 'manager',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
