import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Health & Safety Disclaimer - Repvion',
  description: 'Repvion health and safety disclaimer. Exercise at your own risk.',
}

export default function DisclaimerPage() {
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
        <h2 className="text-3xl font-bold mb-6">Health & Safety Disclaimer</h2>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2025</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h3 className="text-lg font-semibold text-foreground">Not Medical or Professional Advice</h3>
            <p>
              Repvion provides workout plans, exercise information, and fitness tracking for general informational and
              motivational purposes only. This content is <strong className="text-foreground">not</strong> medical
              advice, and it is not a substitute for advice from a qualified healthcare or fitness professional.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">Consult a Physician First</h3>
            <p>
              Before starting any new exercise program or making changes to your physical activity, you should consult
              your physician or another qualified healthcare provider—especially if you have any medical conditions
              (including heart conditions, high blood pressure, diabetes, joint or bone issues, or pregnancy), are
              taking medications, or have any concerns about your ability to exercise safely.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">Exercise at Your Own Risk</h3>
            <p>
              Physical exercise involves inherent risk of injury. You assume full responsibility for any injuries or
              damages that may occur from your use of the service or from performing any exercises or activities
              suggested or logged through Repvion. We are not liable for any such injuries or damages. You should stop
              exercising and seek medical attention if you experience pain, dizziness, shortness of breath, or other
              concerning symptoms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">Accuracy of Information</h3>
            <p>
              While we aim to provide helpful and generally accurate fitness information, we do not guarantee the
              completeness, suitability, or safety of any workout plan or exercise for your individual situation. You
              are responsible for ensuring that any exercise you perform is appropriate for your condition and
              environment and is performed with proper form and safety precautions.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-foreground">Acknowledgment</h3>
            <p>
              By using Repvion, you acknowledge that you have read and understood this Health & Safety Disclaimer and
              that you use the service at your own risk. Your use of the service constitutes acceptance of this
              disclaimer. For our full legal terms, see our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
