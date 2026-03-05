import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Repvion. Forge Your Strength.</p>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/disclaimer" className="hover:text-foreground transition-colors">
              Health & Safety
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
