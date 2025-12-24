import { ConnectButton } from "thirdweb/react";
import {  CheckCircle2, Building2, Lock, Award, FileCheck } from 'lucide-react';
import A11LogoBordered from './A11LogoBordered';
import type { ThirdwebClient } from "thirdweb";
import type { Wallet as WalletType } from "thirdweb/wallets";

interface LoginPageProps {
  client: ThirdwebClient;
  wallets: WalletType[];
}

const LoginPage: React.FC<LoginPageProps> = ({ client, wallets }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(180,130,50,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(180,130,50,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      
      {/* Gradient orbs for depth */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-2xl w-full">
        {/* Gold accent line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-8"></div>
        
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-500/20 p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <A11LogoBordered size={80} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
              A11 SECURE ACCESS PORTAL
            </h1>
            <p className="text-slate-400 text-lg">
              Your Digital Asset Management Platform
            </p>
          </div>

          {/* Authentication Methods Container */}
          <div className="space-y-6 mb-8">

            {/* VERIFIED IDENTITY */}
            <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/50 hover:border-amber-500/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-white font-semibold text-lg tracking-wide">
                  VERIFIED IDENTITY
                </h3>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 space-y-2">
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Email Verification</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Phone Authentication</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Biometric Options Available</span>
                </div>
              </div>
            </div>

            {/* ENTERPRISE SSO */}
            <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/50 hover:border-amber-500/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-white font-semibold text-lg tracking-wide">
                  ENTERPRISE SINGLE SIGN-ON
                </h3>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">Federated Identity Providers</span>
                </div>
                <div className="text-slate-400 text-sm pl-6">
                  Google • GitHub • Microsoft • Discord • X
                </div>
              </div>
            </div>
          </div>

          {/* Connect Button */}
          <div className="flex justify-center mb-8">
            <div className="w-full">
              <ConnectButton
                client={client}
                wallets={wallets}
                theme="dark"
                connectButton={{
                  label: "SECURE LOGIN",
                  className: "!bg-gradient-to-r !from-amber-500 !to-amber-600 hover:!from-amber-600 hover:!to-amber-700 !text-slate-900 !font-bold !py-4 !px-8 !rounded-lg !transition-all !duration-300 !shadow-lg hover:!shadow-amber-500/30 !w-full !text-lg !tracking-wide",
                }}
                connectModal={{
                  title: "Select Authentication Method",
                  size: "wide",
                }}
              />
            </div>
          </div>

          {/* Security Features Divider */}
          <div className="border-t border-slate-700 pt-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Bank-Level Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Award className="w-4 h-4 text-amber-500" />
                <span>SOC 2 Type II Certified</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <FileCheck className="w-4 h-4 text-amber-500" />
                <span>Multi-Factor Authentication</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gold accent line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-8"></div>
      </div>
    </div>
  );
};

export default LoginPage;