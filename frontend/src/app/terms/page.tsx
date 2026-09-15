import type { Metadata } from "next";
import Link from "next/link";

import {
  ContactEmails,
  Detail,
  LegalPage,
  type LegalSection,
} from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "The terms that apply when you use the HybridRAG demonstration service, including acceptable use, availability, and limits of liability.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    heading: "Acceptance of these terms",
    body: (
      <p>
        By using the HybridRAG website or its query API, you agree to these terms. If you
        do not agree, do not use the service. The service is operated by{" "}
        <Detail name="operator" />.
      </p>
    ),
  },
  {
    id: "service",
    heading: "What the service is",
    body: (
      <>
        <p>
          HybridRAG is a technical demonstration of a retrieval-augmented generation
          pipeline. It answers questions from a fixed document corpus chosen by the
          operator, and shows the retrieved chunks behind each answer.
        </p>
        <p>
          It is provided for demonstration and evaluation. It is not a commercial product,
          carries no service level commitment, and is not intended to be relied on for
          professional, legal, medical, financial or safety-critical decisions.
        </p>
      </>
    ),
  },
  {
    id: "use",
    heading: "Use of the service",
    body: (
      <>
        <p>
          You may submit queries and read the answers and cited chunks. No account is
          required. You are responsible for the content of the queries you submit.
        </p>
        <p>
          Generated answers can be incomplete or wrong even when grounded in retrieved
          text. Check the cited chunks before relying on anything the system produces.
        </p>
      </>
    ),
  },
  {
    id: "user-content",
    heading: "Your queries",
    body: (
      <>
        <p>
          You keep whatever rights you have in the text you submit. By submitting a query,
          you grant permission to process it as needed to answer it, which includes sending
          it to the language model provider described in the{" "}
          <Link href="/privacy" className="text-accent underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
        <p>
          Do not submit confidential, personal or sensitive information. Queries are not
          stored by this application, but they do leave our infrastructure in order to be
          answered.
        </p>
      </>
    ),
  },
  {
    id: "prohibited",
    heading: "Prohibited use",
    body: (
      <>
        <p>You may not:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-fg-faint">
          <li>
            attempt to gain unauthorised access to the service, its database, its hosting
            infrastructure or any connected system
          </li>
          <li>
            submit automated or high-volume traffic that degrades the service for others,
            or that is intended to exhaust the model usage budget of the operator
          </li>
          <li>
            attempt to extract credentials, environment configuration or infrastructure
            detail through crafted queries
          </li>
          <li>use the service to generate or distribute unlawful or harmful content</li>
          <li>
            misrepresent generated output as verified, authoritative or professionally
            reviewed information
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "intellectual-property",
    heading: "Intellectual property",
    body: (
      <>
        <p>
          The HybridRAG name, interface design and source code belong to their respective
          authors and are made available under the licence stated in the project
          repository. Corpus documents remain the property of their original authors and
          are used here for demonstration only.
        </p>
        <p>
          Nothing on this site transfers ownership of any third-party material quoted in a
          retrieved chunk.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    heading: "Third-party services",
    body: (
      <p>
        The service depends on third-party providers for database hosting, language model
        access and site hosting. Their availability, terms and pricing are outside our
        control, and a failure or change at any of them can interrupt or end this service
        without notice.
      </p>
    ),
  },
  {
    id: "availability",
    heading: "Availability",
    body: (
      <p>
        The service is offered as-is and may be slow, rate limited, interrupted, changed or
        withdrawn at any time, with or without notice. Retrieval and reranking run on
        modest hardware, so response times vary. No uptime is guaranteed.
      </p>
    ),
  },
  {
    id: "disclaimer",
    heading: "Disclaimer of warranties",
    body: (
      <p>
        The service is provided without warranties of any kind, whether express or implied,
        including implied warranties of merchantability, fitness for a particular purpose
        and non-infringement. We do not warrant that generated answers are accurate,
        complete, current or suitable for any purpose, or that the service will be
        uninterrupted or error free.
      </p>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of liability",
    body: (
      <p>
        To the fullest extent permitted by law, the operator is not liable for any
        indirect, incidental, special, consequential or exemplary damages, or for any loss
        of data, profits, revenue or goodwill, arising from your use of or inability to use
        the service. This applies whether the claim is based in contract, tort or any other
        theory, and whether or not we were advised of the possibility of such damage.
        Nothing here excludes liability that cannot be excluded by law.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to these terms",
    body: (
      <p>
        These Terms may be revised periodically to reflect changes to the application, its
        features, or applicable requirements. The latest revision date will be displayed
        on this page. Continued use of the application following any updates constitutes
        acceptance of the revised Terms.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact",
    body: (
      <p>
        Questions about these terms can be sent to <ContactEmails />, or
        raised as an issue in the project repository linked in the footer.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      intro="HybridRAG is a demonstration project, not a commercial service. These terms describe what it does, what you may and may not do with it, and the limits of what can be expected from it."
      sections={SECTIONS}
    />
  );
}
