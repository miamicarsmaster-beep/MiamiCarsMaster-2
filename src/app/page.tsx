import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { ProcessSection } from "@/components/landing/ProcessSection"
import { ExperienceSection } from "@/components/landing/ExperienceSection"
import { BenefitsSection } from "@/components/landing/BenefitsSection"
import { SystemPreview } from "@/components/landing/SystemPreview"
import { ContactSection } from "@/components/landing/ContactSection"
import { Footer } from "@/components/landing/Footer"
import { FloatingWhatsApp } from "@/components/landing/FloatingWhatsApp"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary scroll-smooth">
      <Navbar />
      <Hero />
      <ProcessSection />
      <ExperienceSection />
      <BenefitsSection />
      <SystemPreview />
      <ContactSection />
      <Footer />
      <FloatingWhatsApp />
    </main>
  )
}
