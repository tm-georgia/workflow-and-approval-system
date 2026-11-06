import express from "express";

const app = express();
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

const port = 3000;

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});