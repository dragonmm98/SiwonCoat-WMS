import type { Metadata } from "next";
import { TaskDetails } from "./task-details";

export const metadata: Metadata = { title: "Task details" };

export default async function TaskDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TaskDetails id={id} />;
}
