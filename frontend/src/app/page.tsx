import { Architecture } from "@/components/home/Architecture";
import { Evaluation } from "@/components/home/Evaluation";
import { Evidence } from "@/components/home/Evidence";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { MadeBy } from "@/components/home/MadeBy";
import { ProductPreview } from "@/components/home/ProductPreview";
import { RetrievalModes } from "@/components/home/RetrievalModes";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProductPreview />
      <HowItWorks />
      <RetrievalModes />
      <Evidence />
      <Architecture />
      <Evaluation />
      <MadeBy />
    </main>
  );
}
