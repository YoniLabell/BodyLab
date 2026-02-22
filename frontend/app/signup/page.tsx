import { Metadata } from "next";
import { SignupContent } from "./signup-content";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignupPage() {
  return <SignupContent />;
}
