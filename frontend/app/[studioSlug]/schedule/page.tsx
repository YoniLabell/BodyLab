import { Metadata } from "next";
import { ScheduleContent } from "./schedule-content";

export const metadata: Metadata = {
  title: "Schedule",
};

export default function SchedulePage({ params }: { params: { studioSlug: string } }) {
  return <ScheduleContent studioSlug={params.studioSlug} />;
}
