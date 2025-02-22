"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut, updateProfile } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { CustomUser } from "@/types/user";
import { db } from "@/lib/firebase";

const AuthContext = createContext<{
  user: CustomUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateUserDetails: (details: Partial<CustomUser>) => void;
}>({
  user: null,
  loading: true,
  logout: async () => {},
  updateUserDetails: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const updateUserDetails = (details: Partial<CustomUser>) => {
    setUser(prev => {
      const updatedUser = prev ? { ...prev, ...details } : { ...details } as CustomUser;
      return updatedUser;
    });
    
    if (auth.currentUser) {
      updateProfile(auth.currentUser, details);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Fetch additional user details from Firestore
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Set user as CustomUser with both Firebase and Firestore data
            setUser({
              ...currentUser,
              ...userData
            } as CustomUser);
          } else {
            // If no custom data exists, just use the basic auth user data
            setUser(currentUser as CustomUser);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(currentUser as CustomUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen-93">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateUserDetails }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
