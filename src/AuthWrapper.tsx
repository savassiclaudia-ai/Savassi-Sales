import { useState, useEffect } from "react";
import App from "./App";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, signInWithGoogle, logout } from "./lib/firebase";

export function AuthWrapper() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F3F2F1]">
        <div className="w-10 h-10 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F3F2F1] flex-col gap-6">
        <h1 className="font-serif-heading text-[#1E3A8A] text-4xl mb-4 text-center">Savassi BI</h1>
        <div className="bg-white p-10 py-12 rounded-sm shadow-sm border border-gray-200 flex flex-col items-center min-w-[350px]">
           <h2 className="text-gray-900 mb-8 text-lg font-medium">Faça login para continuar</h2>
           <button 
             onClick={signInWithGoogle}
             className="px-8 py-3 bg-[#115EA3] hover:bg-[#0F5494] transition-colors text-white text-sm font-semibold w-full rounded-sm"
           >
             Entrar com Google
           </button>
        </div>
      </div>
    );
  }

  return <App />;
}
