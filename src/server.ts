import fastify from "fastify";
import "dotenv/config";
import { getAllPromptsRoute } from "./routes/get-all-prompts";
import { uploadVideoRoute } from "./routes/upload-video";
import { createTranscriptionRoute } from "./routes/create-transcription";

const app = fastify();

const PORT = process.env.PORT;

app.register(getAllPromptsRoute);
app.register(uploadVideoRoute);
app.register(createTranscriptionRoute);

app
  .listen({ port: Number(PORT) })
  .then(() => console.info("🚀 Server is running on port " + PORT));
