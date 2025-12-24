import { TrendingUp, Lock, Users, ArrowRight } from "lucide-react";
import A11LogoBordered from "./A11LogoBordered";

interface SplashPageProps {
  onEnter: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(180,130,50,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(180,130,50,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      {/* Gradient orbs for depth */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-6xl w-full py-8 md:py-0">
        <div className="text-center mb-12">
          {/* Main Heading with integrated logo */}
          <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
            <A11LogoBordered size={80} />
            {/* Alternative: <A11LogoAngular size={80} /> */}
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
              INVESTMENT GROUP
            </h1>
            
          </div>

          <p className="text-xl md:text-2xl text-slate-400 mb-3 tracking-wide">
            Institutional-Grade Digital Asset Management
          </p>
          <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-8"></div>
        </div>

        {/* CTA Section */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-500/20 p-8 text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
            BEGIN YOUR JOURNEY
          </h2>
          <p className="text-slate-400 text-sm mb-6 max-w-2xl mx-auto">
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident.
          </p>
          <button
            onClick={onEnter}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold py-3 px-10 rounded-lg transition-all duration-300 shadow-lg hover:shadow-amber-500/30 text-base tracking-wide inline-flex items-center gap-2"
          >
            ACCESS PORTAL
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-slate-500 text-xs tracking-wider uppercase">
                Bank-Level Security • SOC 2 Certified • Multi-Factor
                Authentication
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6 hover:border-amber-500/40 transition-all duration-300">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
              SECURE CUSTODY
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Institutional-grade security protocols protect your assets.
            </p>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6 hover:border-amber-500/40 transition-all duration-300">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
              STRATEGIC GROWTH
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              Professional portfolio management strategies.
            </p>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6 hover:border-amber-500/40 transition-all duration-300">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
              FAMILY OFFICE
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ut enim ad minim veniam, quis nostrud exercitation. Dedicated
              support for high-net-worth families.
            </p>
          </div>
        </div>

        {/* Bottom gold accent line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-8"></div>
      </div>
    </div>
  );
};

export default SplashPage;
