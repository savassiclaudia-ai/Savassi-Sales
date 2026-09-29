import { useState } from 'react';

export function LoginView({ onLogin }: { onLogin: (role: 'admin' | 'crm') => void }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F3F2F1] text-gray-900 font-sans">
      <div className="bg-white p-10 rounded-xl shadow-xl border border-gray-200 max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Entrar no Sistema</h1>
        <div className="space-y-4">
          <button 
            onClick={() => onLogin('admin')}
            className="w-full py-3 bg-[#115EA3] text-white rounded-lg font-semibold hover:bg-[#0f5494] transition-colors"
          >
            Acesso Executivo (Admin)
          </button>
          <button 
            onClick={() => onLogin('crm')}
            className="w-full py-3 bg-white text-[#115EA3] border border-[#115EA3] rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Acesso Comercial (CRM)
          </button>
        </div>
      </div>
    </div>
  );
}
