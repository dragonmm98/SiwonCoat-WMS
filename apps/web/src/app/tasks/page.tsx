import type { Metadata } from "next";
import { TaskQueue } from "./task-queue";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return <TaskQueue />;
}
