import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Version,
} from "@nestjs/common";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TasksService } from "./tasks.service";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @Version("1")
  list() {
    return this.tasks.list();
  }

  @Get(":id")
  @Version("1")
  detail(@Param("id", ParseUUIDPipe) id: string) {
    return this.tasks.detail(id);
  }

  @Post()
  @Version("1")
  create(@Body() input: CreateTaskDto) {
    return this.tasks.create(input);
  }
}
