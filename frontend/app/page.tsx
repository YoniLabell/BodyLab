import Link from "next/link";
import { Metadata } from "next";
import { LandingContent } from "@/components/landing-content";

export const metadata: Metadata = {
  title: "BodyLab — Premium Fitness Studio",
  description: "Book world-class fitness classes: yoga, HIIT, pilates, cycling and more.",
};

export default function HomePage() {
  return <LandingContent />;
}
