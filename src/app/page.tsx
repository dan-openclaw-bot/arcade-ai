'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Video, Image as ImageIcon, Zap, Key, CheckCircle2, XCircle } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white selection:bg-violet-100 selection:text-violet-900 font-sans overflow-x-hidden relative">

      {/* Background gradients (Ultra-modern 2026 feel) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-violet-50/80 via-fuchsia-50/40 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-100/50 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-50/50 blur-[100px] pointer-events-none -z-10" />

      {/* Navbar Minimaliste */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-gray-100/50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl w-full mx-auto">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-200 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-xl text-gray-900 tracking-tight">Aura</span>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2.5 text-sm font-semibold text-gray-800 bg-white/80 border border-gray-200/80 rounded-full hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-300 backdrop-blur-md"
          >
            Se connecter
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center text-center px-4 pt-28 pb-20 max-w-5xl mx-auto w-full relative z-10">

        {/* Badge */}
        <div className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200/60 shadow-sm text-gray-600 text-xs font-semibold uppercase tracking-widest mb-10 hover:border-violet-200 hover:bg-violet-50/50 transition-colors cursor-default">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
          </span>
          La révolution du modèle Bring-Your-Own-Key
        </div>

        {/* Headline */}
        <h1 className="text-6xl sm:text-8xl font-black text-gray-900 tracking-tighter leading-[1.05] mb-8">
          Le studio IA Ultime.<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500">
            Zéro abonnement.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl sm:text-2xl text-gray-500 mb-12 max-w-3xl leading-relaxed font-medium">
          Pourquoi payer <span className="line-through text-gray-400">70€ à 100€/mois</span> pour une interface ?<br />
          Aura est un studio <b className="text-gray-900">100% gratuit</b>. Connectez simplement votre clé API et créez des vidéos et photos avec Sora 2 Pro & Gemini 3 en payant le coût réel, au centime près.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto relative">
          <div className="absolute inset-0 bg-violet-600 blur-2xl opacity-20 rounded-full"></div>
          <button
            onClick={() => router.push('/login')}
            className="relative w-full sm:w-auto flex items-center justify-center gap-2.5 px-10 py-5 bg-gray-900 text-white rounded-full text-lg font-semibold transition-all hover:bg-gray-800 hover:scale-[1.02] shadow-xl shadow-gray-200"
          >
            Accéder au Studio Gratuitement
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-400 flex items-center gap-1.5 font-medium">
          <Key className="w-4 h-4 text-violet-500" />
          Nécessite uniquement votre propre clé API (OpenAI / Google).
        </p>
      </main>

      {/* Comparison Section (Aura vs The Rest) */}
      <section className="w-full max-w-5xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-gray-100/50 overflow-hidden">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* The Old Way */}
            <div className="p-10 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-500 flex items-center gap-2 mb-6">
                <XCircle className="w-6 h-6 text-gray-400" />
                Les autres (Arcade, Speel...)
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="text-red-400 font-bold mt-0.5">✕</span>
                  <span>Abonnement mensuel de <b>70€ à 100€/mois</b>.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="text-red-400 font-bold mt-0.5">✕</span>
                  <span>Crédits limités, même à ce prix.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <span className="text-red-400 font-bold mt-0.5">✕</span>
                  <span>Marges énormes prises sur les coûts de l'IA.</span>
                </li>
              </ul>
              <div className="mt-8 pt-8 border-t border-gray-200/60">
                <div className="text-3xl font-black text-gray-400 line-through decoration-red-400/50 decoration-4">1 200€ / an</div>
              </div>
            </div>

            {/* The Aura Way */}
            <div className="p-10 bg-gradient-to-br from-violet-50 to-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-100 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>
              <h3 className="text-xl font-bold text-violet-900 flex items-center gap-2 mb-6 relative z-10">
                <CheckCircle2 className="w-6 h-6 text-violet-600" />
                Le studio Aura AI
              </h3>
              <ul className="space-y-4 relative z-10">
                <li className="flex items-start gap-3 text-gray-800">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span><b>Interface 100% Gratuite</b> à vie.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-800">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>Vous fournissez votre clé API : vous payez le coût réel fournisseur.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-800">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>Accès illimité sans abonnement. Créez autant que vous voulez.</span>
                </li>
              </ul>
              <div className="mt-8 pt-8 border-t border-violet-100 relative z-10">
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">0€</div>
                  <span className="text-violet-600/70 font-semibold uppercase tracking-wider text-sm">+ vos frais d'API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid (Bénéfices) */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Une expérience de création premium.</h2>
          <p className="text-gray-500 text-lg">Gratuit ne veut plus dire bas de gamme. Aura redéfinit les standards 2026.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="group p-8 rounded-3xl bg-white border border-gray-100 hover:border-violet-100 shadow-sm hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-6 shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-xl mb-3">Vidéos Cinématographiques</h3>
            <p className="text-gray-500 leading-relaxed font-medium">
              Pilotez les modèles <b>Sora 2 Pro</b> et <b>Veo 2</b>. Plus besoin de payer 100€/mois pour avoir accès à la vidéo IA de qualité studio.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group p-8 rounded-3xl bg-white border border-gray-100 hover:border-fuchsia-100 shadow-sm hover:shadow-xl hover:shadow-fuchsia-500/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-500 flex items-center justify-center text-white mb-6 shadow-md shadow-fuchsia-500/20 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-xl mb-3">Photos Ultra-Réalistes</h3>
            <p className="text-gray-500 leading-relaxed font-medium">
              Maîtrisez les prompts complexes avec <b>Nano Banana 2</b>. Une précision chirurgicale pour des visuels photoréalistes en quelques secondes.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group p-8 rounded-3xl bg-white border border-gray-100 hover:border-emerald-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white mb-6 shadow-md shadow-gray-900/20 group-hover:scale-110 transition-transform">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-xl mb-3">Privé & Sécurisé</h3>
            <p className="text-gray-500 leading-relaxed font-medium">
              Vos clés API sont stockées <b>uniquement sur votre navigateur</b>. Elles ne transitent jamais sur nos bases de données. Vous êtes le seul maître à bord.
            </p>
          </div>
        </div>
      </section>

      {/* Footer minimaliste moderne */}
      <footer className="w-full text-center py-10 text-sm font-medium text-gray-400 border-t border-gray-100 bg-white relative z-20 mt-auto">
        &copy; {new Date().getFullYear()} Aura AI. La liberté de créer.
      </footer>
    </div>
  );
}
