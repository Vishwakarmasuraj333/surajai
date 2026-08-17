import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import ChatShowcase from '@/components/landing/ChatShowcase';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#07070a] text-gray-100 flex flex-col justify-between">
      <Navbar />
      <div className="flex-1">
        <Hero />
        <ChatShowcase />
        <Features />
        <Pricing />
        <FAQ />
      </div>
      <Footer />
    </main>
  );
}
