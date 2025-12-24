import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="px-6 lg:px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Support Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900 transition">
                  Help Centre
                </Link>
              </li>
            </ul>
          </div>

          {/* Hosting Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Hosting</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard/owner" className="text-sm text-gray-600 hover:text-gray-900 transition">
                  List your desk
                </Link>
              </li>
              <li>
                <Link href="/help/hosting/responsible" className="text-sm text-gray-600 hover:text-gray-900 transition">
                  Hosting responsibly
                </Link>
              </li>
            </ul>
          </div>

          {/* deskday Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">deskday</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span>© 2025 deskday, Inc.</span>
              <span className="hidden md:inline">·</span>
              <Link href="/privacy" className="hover:text-gray-900 transition">
                Privacy
              </Link>
              <span className="hidden md:inline">·</span>
              <Link href="/terms" className="hover:text-gray-900 transition">
                Terms
              </Link>
              <span className="hidden md:inline">·</span>
              <Link href="/about/company-details" className="hover:text-gray-900 transition" target="_blank">
                Company details
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Language/Currency Selector */}
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="font-semibold">English (IE)</span>
              </button>

              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition">
                <span className="font-semibold">€ EUR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
