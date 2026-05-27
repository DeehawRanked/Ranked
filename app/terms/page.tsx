'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="px-4 py-8 max-w-lg mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-zinc-500 text-sm hover:text-white transition-colors">
          ← Back
        </button>
      </div>

      <h1 className="text-white font-black text-2xl mb-1">Terms of Service</h1>
      <p className="text-zinc-600 text-xs mb-8">Last updated: May 2026</p>

      <div className="space-y-8 text-sm text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-white font-bold text-base mb-2">1. Acceptance of Terms</h2>
          <p>
            By creating an account or using RANKED ("the App"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, you may not use the App.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">2. Eligibility</h2>
          <p>
            You must be at least 13 years of age to use RANKED. By using the App, you represent and warrant that you meet this requirement. If you are under 18, you represent that you have permission from a parent or guardian.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">3. User Accounts</h2>
          <p className="mb-2">
            You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-500">
            <li>Provide accurate and truthful information when registering</li>
            <li>Keep your password secure and not share it with others</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Not create accounts for the purpose of abuse, manipulation, or gaming rankings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">4. User Content</h2>
          <p className="mb-2">
            You retain ownership of the photos and content you post to RANKED. By posting content, you grant RANKED a non-exclusive, royalty-free, worldwide license to display, distribute, and promote your content within the App and its marketing materials.
          </p>
          <p>
            You represent that you own or have the necessary rights to the content you post, and that your content does not infringe on the rights of any third party.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">5. Prohibited Content</h2>
          <p className="mb-2">The following content is strictly prohibited on RANKED:</p>
          <ul className="list-disc list-inside space-y-1 text-zinc-500">
            <li>Nudity, pornography, or sexually explicit material</li>
            <li>AI-generated or digitally manipulated images presented as authentic photographs</li>
            <li>Racist, hateful, discriminatory, or dehumanizing content</li>
            <li>Harassment, threats, or targeted abuse of any individual</li>
            <li>Content that violates any applicable local, national, or international law</li>
            <li>Spam, misleading information, or impersonation of others</li>
            <li>Content depicting illegal activity or encouraging harm</li>
          </ul>
          <p className="mt-2">
            Violations may result in content removal, account suspension, or permanent termination.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">6. The Ranking System</h2>
          <p className="mb-2">
            RANKED uses an algorithmic scoring system based on organic engagement including likes, comments, shares, and engagement velocity. All active posts compete within the same season.
          </p>
          <p className="mb-2">
            Posts with zero likes are subject to a 72-hour survival window, after which they may become inactive. Rankings reflect organic performance only.
          </p>
          <p>
            RANKED reserves the right to modify the ranking algorithm at any time to ensure fairness and integrity of the platform.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">7. Boosts and Paid Features</h2>
          <p className="mb-2">
            RANKED offers optional paid "Boost" features that increase the visibility and discovery of your posts through guaranteed impressions. By purchasing a Boost you agree to the following:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-500">
            <li>Boost purchases are final and non-refundable unless required by applicable law</li>
            <li>Boosts purchase guaranteed impressions (views) only and have no effect on organic rankings or scores</li>
            <li>Unused impressions do not roll over and expire when the post becomes inactive</li>
            <li>Prices are subject to change with reasonable notice</li>
            <li>RANKED reserves the right to suspend Boost eligibility for accounts that violate these Terms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">8. Content Moderation</h2>
          <p>
            RANKED uses a community-driven reporting system supplemented by automated review triggers. Posts that accumulate a threshold number of reports relative to their engagement will be placed under review and removed from rankings pending evaluation. RANKED reserves the right to remove any content that violates these Terms at its sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">9. Account Termination</h2>
          <p className="mb-2">
            You may delete your account at any time from your Profile settings. Upon deletion, your account data and posts will be removed from the App.
          </p>
          <p>
            RANKED reserves the right to suspend or permanently terminate accounts that violate these Terms, engage in manipulation of rankings, or engage in any conduct harmful to the platform or its users.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">10. Intellectual Property</h2>
          <p>
            The RANKED name, logo, design, and underlying technology are owned by RANKED and protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works without express written permission.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">11. Disclaimer of Warranties</h2>
          <p>
            THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. RANKED DOES NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">12. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, RANKED SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE APP, EVEN IF RANKED HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">13. Changes to Terms</h2>
          <p>
            RANKED reserves the right to update these Terms at any time. We will notify users of material changes through the App. Continued use of the App after changes take effect constitutes your acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">14. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold text-base mb-2">15. Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <span className="text-zinc-300">kingazad153@yahoo.com</span>
          </p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-800">
        <Link href="/privacy" className="text-zinc-500 text-sm hover:text-white transition-colors">
          View Privacy Policy →
        </Link>
      </div>
    </div>
  );
}
