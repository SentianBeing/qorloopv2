import React, { useState } from 'react';
import { Mail, Lock, Eye, ArrowRight, ShieldCheck, RefreshCw, LineChart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import logo from '../../assets/qorloop-logo.png';

/** Demo sign-in screen. Any credentials work; it only sets a session flag. */
export const LoginView: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('omar@dohafresh.qa');
  const [password, setPassword] = useState('demo-password');

  const features = [
    { icon: RefreshCw, title: 'Connect', text: 'Bring your ERP and every marketplace file into one catalogue.' },
    { icon: LineChart, title: 'Predict', text: 'Spot stock and price mismatches before customers do.' },
    { icon: ShieldCheck, title: 'Act', text: 'Generate corrected marketplace files in one click.' },
  ];

  return (
    <div className="min-h-screen flex bg-[#F2F7F6]">
      {/* Brand panel */}
      <div className="q-hero hidden lg:flex w-[46%] flex-col justify-between p-12 text-white relative overflow-hidden">
        <img src={logo} alt="Qorloop" className="h-16 w-auto self-start" />
        <div className="max-w-md">
          <div className="text-[11px] font-bold tracking-[1.6px] uppercase text-[#8CFFE7]">Marketplace & catalogue operations</div>
          <h1 className="mt-3 text-[38px] leading-[1.1] font-bold tracking-tight">
            One catalogue. Every marketplace. Always in sync.
          </h1>
          <p className="mt-4 text-[15px] text-[#A9D9CF] leading-relaxed">
            Qorloop keeps your ERP prices, marketplace prices and stock aligned across Talabat, Snoonu, Rafeeq and
            more.
          </p>
          <div className="mt-8 space-y-3">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-xl bg-white/[0.06] border border-[#8CFFE7]/15 p-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#00D9A9]/15 text-[#00FFD2] flex items-center justify-center shrink-0">
                  <f.icon className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="text-[13px] text-[#A9D9CF]">{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-[#7FA8A0]">© 2026 Qorloop · Connect Predict Act</div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login();
          }}
          className="w-full max-w-[400px]"
        >
          <div className="lg:hidden mb-8 rounded-2xl bg-[#031E1B] p-5">
            <img src={logo} alt="Qorloop" className="h-12 w-auto" />
          </div>
          <h2 className="text-[28px] font-bold tracking-tight text-gray-900">Welcome back</h2>
          <p className="mt-1 text-sm text-gray-500">Sign in to your Qorloop workspace.</p>

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="text-[13px] font-semibold text-gray-700">Work email</span>
              <div className="mt-1.5 flex items-center gap-2 h-11 px-3 rounded-[10px] border border-gray-300 bg-white focus-within:border-[#00B894] focus-within:ring-4 focus-within:ring-[#00D9A9]/15">
                <Mail className="w-4 h-4 text-gray-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-transparent outline-none text-sm text-gray-900" />
              </div>
            </label>
            <label className="block">
              <div className="flex justify-between">
                <span className="text-[13px] font-semibold text-gray-700">Password</span>
                <span className="text-[13px] font-semibold text-[#027864]">Forgot password?</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 h-11 px-3 rounded-[10px] border border-gray-300 bg-white focus-within:border-[#00B894] focus-within:ring-4 focus-within:ring-[#00D9A9]/15">
                <Lock className="w-4 h-4 text-gray-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 bg-transparent outline-none text-sm text-gray-900" />
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
            </label>
            <label className="flex items-center gap-2 text-[13px] text-gray-600">
              <input type="checkbox" defaultChecked className="rounded" />
              Keep me signed in on this device
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 w-full h-11 inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-semibold text-white bg-[#027864] hover:bg-[#02604F] transition-colors"
          >
            Sign in
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="mt-6 flex items-center gap-3 text-xs text-gray-400">
            <div className="h-px flex-1 bg-gray-200" />
            or
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <button
            type="button"
            onClick={login}
            className="mt-6 w-full h-11 rounded-[10px] text-sm font-semibold text-gray-800 bg-white border border-gray-300 hover:bg-gray-50"
          >
            Continue with company SSO
          </button>
          <p className="mt-8 text-center text-xs text-gray-400">Demo workspace · any credentials will sign you in</p>
        </form>
      </div>
    </div>
  );
};
