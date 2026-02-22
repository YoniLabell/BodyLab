import { Metadata } from "next";
import { BookingsContent } from "./bookings-content";

export const metadata: Metadata = {
  title: "My Bookings",
};

export default function BookingsPage() {
  return <BookingsContent />;
}
