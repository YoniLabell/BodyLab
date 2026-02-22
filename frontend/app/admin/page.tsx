import { Metadata } from "next";
import { AdminContent } from "./admin-content";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default function AdminPage() {
  return <AdminContent />;
}
