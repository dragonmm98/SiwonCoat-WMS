import type { Metadata } from "next";
import { CreateTaskForm } from "./create-task-form";

export const metadata: Metadata = { title: "Create warehouse task" };

export default function CreateTaskPage() {
  return <CreateTaskForm />;
}
