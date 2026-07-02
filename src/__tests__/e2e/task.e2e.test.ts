import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { vi } from "vitest";
import testPrisma from "./setup.js";

// Mock the prisma singleton to use the test client
vi.mock("../../lib/prisma.js", () => ({
  default: testPrisma,
}));

// Import app AFTER mocking prisma
const { default: app } = await import("../../app.js");
import request from "supertest";

describe("Task API E2E Tests", () => {
  beforeEach(async () => {
	// Clean up database between tests
    await testPrisma.task.deleteMany();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe("POST /api/tasks", () => {
    it("should create a new task", async () => {
      const res = await request(app)
        .post("/api/tasks")
        .send({ title: "E2E Task", description: "E2E Description" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.title).toBe("E2E Task");
      expect(res.body.description).toBe("E2E Description");
      expect(res.body.completed).toBe(false);
    });

    it("should return 400 when the title is missing", async () => {
      const res = await request(app).post("/api/tasks").send({ description: "No title" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/tasks", () => {
    it("should return an empty array when there are no tasks", async () => {
      const res = await request(app).get("/api/tasks");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return all created tasks", async () => {
      await request(app).post("/api/tasks").send({ title: "Task 1" });
      await request(app).post("/api/tasks").send({ title: "Task 2" });

      const res = await request(app).get("/api/tasks");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe("GET /api/tasks/:id", () => {
    it("should return 400 for a non-numeric id", async () => {
      const res = await request(app).get("/api/tasks/abc");

      expect(res.status).toBe(400);
    });

    it("should return 404 for a non-existent task", async () => {
      const res = await request(app).get("/api/tasks/999999");

      expect(res.status).toBe(404);
    });

    it("should return the task when it exists", async () => {
      const created = await request(app).post("/api/tasks").send({ title: "Findable Task" });

      const res = await request(app).get(`/api/tasks/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Findable Task");
    });
  });

  describe("PUT /api/tasks/:id", () => {
    it("should return 400 for a non-numeric id", async () => {
      const res = await request(app).put("/api/tasks/abc").send({ title: "Updated" });

      expect(res.status).toBe(400);
    });

    it("should return 404 for a non-existent task", async () => {
      const res = await request(app).put("/api/tasks/999999").send({ title: "Updated" });

      expect(res.status).toBe(404);
    });

    it("should update an existing task", async () => {
      const created = await request(app).post("/api/tasks").send({ title: "Original Title" });

      const res = await request(app)
        .put(`/api/tasks/${created.body.id}`)
        .send({ title: "Updated Title", completed: true });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated Title");
      expect(res.body.completed).toBe(true);
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    it("should return 400 for a non-numeric id", async () => {
      const res = await request(app).delete("/api/tasks/abc");

      expect(res.status).toBe(400);
    });

    it("should return 404 for a non-existent task", async () => {
      const res = await request(app).delete("/api/tasks/999999");

      expect(res.status).toBe(404);
    });

    it("should delete an existing task", async () => {
      const created = await request(app).post("/api/tasks").send({ title: "To be deleted" });

      const res = await request(app).delete(`/api/tasks/${created.body.id}`);

      expect(res.status).toBe(204);

      const getRes = await request(app).get(`/api/tasks/${created.body.id}`);
      expect(getRes.status).toBe(404);
    });
  });
});
