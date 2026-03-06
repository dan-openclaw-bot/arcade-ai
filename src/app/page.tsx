'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Video, Image as ImageIcon, Zap, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      {/* Navbar Minimaliste */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">Aura</span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
        >
          Se connecter
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center text-center px-4 pt-20 pb-16 max-w-4xl mx-auto w-full">
        {/* Badge "Nouveau" */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-8">
          <Zap className="w-3.5 h-3.5" />
          Génération Illimitée & Gratuite
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
          L'IA de qualité studio.<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
            Sans dépenser un centime.
          </span>
        </h1>

        {/* Subheadline (Bénéfices) */}
        <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl leading-relaxed">
          Oubliez les abonnements coûteux à 20$/mois. Aura vous offre un accès direct et <b>100% gratuit</b> aux meilleurs modèles d'IA mondiaux (Sora, Veo 2, Gemini) pour créer des photos et vidéos époustouflantes, en un clic.
        </p>

        {/* CTA Principaux */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full text-lg font-medium transition-all hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-200 hover:-translate-y-0.5"
          >
            Commencer à créer gratuitement
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          Aucun moyen de paiement requis. Pas d'abonnement.
        </p>

        {/* Grille de Bénéfices */}
        <div className="grid sm:grid-cols-3 gap-6 mt-24 text-left w-full border-t border-gray-100 pt-16">
          <div className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Vidéos Cinématographiques</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Donnez vie à vos idées avec les modèles vidéo state-of-the-art : <b>Sora 2 Pro</b> et <b>Veo 2</b>. Qualité 1080p Ultra-réaliste instantanée.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-fuchsia-50 flex items-center justify-center text-fuchsia-600 mb-2">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Photos Ultra-Détaillées</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Générez des visuels parfaits avec <b>Nano Banana 2</b> et <b>Imagen 4 Ultra</b>. Qualité studio professionnelle, sans limite de créativité.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Totalement Gratuit</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Nous avons supprimé la barrière de l'argent. <b>Zéro frais cachés</b>, aucune clé d'API compliquée à configurer pour vous. Connectez-vous et créez.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 text-sm text-gray-400 border-t border-gray-100 mt-auto">
        &copy; {new Date().getFullYear()} Aura AI. Conçu pour les créateurs.
      </footer>
    </div>
  );
}
