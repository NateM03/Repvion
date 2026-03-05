import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Terms of Service - Repvion',
  description: 'Repvion Terms of Service. Forge Your Strength.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold">Repvion</h1>
          </Link>
          <Link href="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <h2 className="text-3xl font-bold mb-6">Terms of Service</h2>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2025</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h3 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h3>
            <p>
              By accessing or using Repvion (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree, do not use the Service. We may update these terms from time to time; continued use
              after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">2. Description of Service</h3>
            <p>
              Repvion provides personalized workout planning, progress tracking, gamification (XP, levels, streaks), and
              social features such as leaderboards and following other users. Content and features may change without
              notice.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">3. Account & Eligibility</h3>
            <p>
              You must be at least 13 years of age (or the age of consent in your jurisdiction) to use the Service. You
              are responsible for keeping your account credentials secure and for all activity under your account. You
              must provide accurate information when registering.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">4. Health & Fitness Disclaimer</h3>
            <p>
              The Service is for informational and motivational purposes only. It is not medical advice. You should
              consult a physician or healthcare provider before starting any exercise program, especially if you have any
              medical conditions or concerns. See our{' '}
              <Link href="/disclaimer" className="text-primary hover:underline">
                Health & Safety Disclaimer
              </Link>{' '}
              for full details.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">5. Acceptable Use</h3>
            <p>
              You agree not to use the Service to: violate any law; harass or harm others; impersonate any person or
              entity; spam or abuse the platform; attempt to gain unauthorized access to systems or other accounts; or
              use the Service for any purpose that could damage, disable, or overburden the Service. We may suspend or
              terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">6. Intellectual Property</h3>
            <p>
              Repvion and its content, features, and design are owned by us or our licensors. You may not copy, modify,
              distribute, or create derivative works without permission. You retain ownership of content you submit;
              you grant us a license to use it to operate and improve the Service.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">7. Disclaimer of Warranties</h3>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or
              implied. We do not warrant that the Service will be uninterrupted, error-free, or free of harmful
              components.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, Repvion and its operators shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, or any loss of profits, data, or use, arising from
              your use of the Service or any exercise or activity you undertake. Our total liability shall not exceed
              the amount you paid us, if any, in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">9. Termination</h3>
            <p>
              You may stop using the Service at any time. We may suspend or terminate your account or access to the
              Service at any time, with or without cause or notice. Upon termination, your right to use the Service
              ceases immediately.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">10. Contact</h3>
            <p>
              For questions about these Terms, please contact us through the contact information provided on our
              website or in the app.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
