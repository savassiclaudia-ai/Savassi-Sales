import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtK(n: number | undefined | null) {
  if (!n || n === 0) return 'R$ 0';
  if (n >= 1000000) return 'R$ ' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return 'R$ ' + (n / 1000).toFixed(0) + 'k';
  return 'R$ ' + Math.round(n);
}

export function fmtFull(n: number | undefined | null) {
  return n ? 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—';
}

export function avatarColor(name: string) {
  const colors = [
    'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/30',
    'bg-white/5 text-[#E0E0E0] border-white/10',
    'bg-gradient-to-tr from-[#C5A059]/20 to-[#0A0A0B] text-[#C5A059] border-[#C5A059]/20',
  ];
  const i = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[i];
}

export function initials(name: string) {
  if (!name) return '?';
  return name.split(' ').filter(w => w.length > 0).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

export const MONTH_NS = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export function monthLabel(ym: string) {
  if(!ym) return '—';
  const[y,m] = ym.split('-');
  return MONTH_NS[+m] + '/' + y.slice(2);
}
