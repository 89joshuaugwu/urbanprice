import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp, ShieldCheck, Gauge } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="flex flex-col items-center gap-6 py-20 text-center">
        <Image src="/logo.png" alt="UrbanPrice logo" width={88} height={88} priority />
        <h1 className="font-display max-w-2xl text-4xl font-bold text-up-primary sm:text-5xl">
          Know what it&apos;s worth.
        </h1>
        <p className="max-w-xl text-lg text-up-text-secondary">
          An automated valuation model for urban housing units, built on ensembled
          regression trees and trained against an established housing benchmark dataset.
        </p>
        <Link
          href="/valuate"
          className="inline-flex items-center gap-2 rounded-lg bg-up-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Get an Estimate <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-6 border-t border-up-border py-14 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
          <TrendingUp className="h-6 w-6 text-up-accent" />
          <h3 className="font-display font-semibold text-up-primary">Ensembled regression</h3>
          <p className="text-sm text-up-text-secondary">
            Random Forest and Gradient Boosting trained offline in Python, compared
            head-to-head on real evaluation metrics.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
          <Gauge className="h-6 w-6 text-up-accent" />
          <h3 className="font-display font-semibold text-up-primary">Confidence range</h3>
          <p className="text-sm text-up-text-secondary">
            Every estimate comes with a likely range, derived honestly from the
            spread of the ensemble&apos;s individual trees.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
          <ShieldCheck className="h-6 w-6 text-up-accent" />
          <h3 className="font-display font-semibold text-up-primary">Transparent methodology</h3>
          <p className="text-sm text-up-text-secondary">
            Full dataset disclosure and model metrics — nothing about how this
            works is hidden.{" "}
            <Link href="/methodology" className="underline hover:text-up-primary">
              See the details
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
