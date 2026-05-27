'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="px-4 py-8 max-w-lg mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-zinc-500 text-sm hover:text-white transition-colors">
          ← Back
        </button>
      </div>

      <h1 className="text-white font-black text-2xl mb-1">Privacy Policy</h1>
      <p className="text-zinc-600 text-xs mb-8">Last updated: May 2026</p>

      <div className="space-y-8 text-sm text-zinc-400 leading-relaxed">
        <section>
          <p>
            RANKED ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our App.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">1. Information We Collect</h2>
          <p className="mb-2">We collect the following types of information:</p>
          <div className="space-y-3">
            <div>
              <p className="text-zinc-300 font-semibold text-xs uppercase tracking-widest mb-1">Account Information</p>
              <ul className="list-disc list-inside space-y-1 text-zinc-500">
                <li>Email address (used for sign-in and account recovery)</li>
                <li>Username (displayed publicly within the App)</li>
                <li>Password (stored in encrypted form — we never see your raw password)</li>
              </ul>
            </div>
            <div>
              <p className="text-zinc-300 font-semibold text-xs uppercase tracking-widest mb-1">Profile & Content</p>
              <ul className="list-disc list-inside space-y-1 text-zinc-500">
                <li>Profile picture and biography you choose to provide</li>
                <li>Photos and captions you post to the App</li>
                <li>Comments, likes, and other engagement activity</li>
              </ul>
            </div>
            <div>
              <p className="text-zinc-300 font-semibold text-xs uppercase tracking-widest mb-1">Usage Data</p>
              <ul className="list-disc list-inside space-y-1 text-zinc-500">
                <li>Posts viewed, engagement actions taken</li>
                <li>Boost purchases and impression data</li>
                <li>Device type and operating system (for compatibility)</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-500">
            <li>To create and manage your account</li>
            <li>To display your content and profile to other users</li>
            <li>To calculate engagement scores and rankings</li>
            <li>To deliver Boost impressions you have purchased</li>
            <li>To enforce our Terms of Service and content moderation policies</li>
            <li>To improve the App and develop new features</li>
            <li>To send important account-related notifications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">3. Data Storage</h2>
          <p className="mb-2">
            Your data is stored on secured cloud servers (Supabase / PostgreSQL) with industry-standard encryption at rest and in transit. We do not store sensitive data on your device beyond session credentials required to keep you logged in.
          </p>
          <p>
            We retain your data for as long as your account is active or as needed to provide our services. You may request deletion at any time by deleting your account from Profile → Settings → Delete Account.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">4. Sharing Your Information</h2>
          <p className="mb-2">
            We do not sell your personal information. Your public profile, posts, username, and engagement activity are visible to other users of the App by design.
          </p>
          <p className="mb-2">We may share your information in the following limited circumstances:</p>
          <ul className="list-disc list-inside space-y-1 text-zinc-500">
            <li>With service providers who help us operate the App (e.g., cloud hosting, payment processing), under strict confidentiality obligations</li>
            <li>If required by law, court order, or to protect the rights and safety of our users</li>
            <li>In connection with a merger, acquisition, or sale of assets, with appropriate notice</li>
          </ul>
          <p className="mt-2">
            Your email address is never displayed publicly or shared with other users.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">5. Your Rights</h2>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 text-zinc-500">
            <li><span className="text-zinc-400">Access</span> — request a copy of the personal data we hold about you</li>
            <li><span className="text-zinc-400">Correction</span> — update inaccurate or incomplete information from your Profile settings</li>
            <li><span className="text-zinc-400">Deletion</span> — delete your account and associated data at any time from Profile → Settings → Delete Account</li>
            <li><span className="text-zinc-400">Portability</span> — request your data in a portable format</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, contact us at{' '}
            <span className="text-zinc-300">kingazad153@yahoo.com</span>
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">6. Cookies and Tracking</h2>
          <p>
            RANKED does not use third-party advertising cookies or cross-site tracking technologies. We may use essential session storage to maintain your login state and app preferences on your device.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">7. Children's Privacy</h2>
          <p>
            RANKED is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected data from a child under 13 without verified parental consent, we will take steps to delete that information promptly. If you believe a child under 13 has provided us with their information, please contact us at{' '}
            <span className="text-zinc-300">kingazad153@yahoo.com</span>
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">8. Security</h2>
          <p>
            We implement reasonable technical and organizational measures to protect your personal information. However, no method of transmission or storage is 100% secure. We encourage you to use a strong, unique password and to log out of shared devices.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes through the App or by email. Continued use of the App after changes take effect constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">10. Contact</h2>
          <p>
            For privacy questions or requests, contact us at{' '}
            <span className="text-zinc-300">kingazad153@yahoo.com</span>
          </p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-800">
        <Link href="/terms" className="text-zinc-500 text-sm hover:text-white transition-colors">
          View Terms of Service →
        </Link>
      </div>
    </div>
  );
}
