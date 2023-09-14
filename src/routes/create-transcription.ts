import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import fs from "node:fs";
import { openai } from "../lib/openai";

export const createTranscriptionRoute = async (app: FastifyInstance) => {
  app.post("/videos/:videoId/transcription", async (req, rep) => {
    const paramsSchema = z.object({ videoId: z.string().uuid() }).strict();

    const paramsResult = paramsSchema.safeParse(req.params);

    if (!paramsResult.success) {
      return rep.code(400).send({ error: "Invalid payload" });
    }

    const videoId = paramsResult.data.videoId;

    const bodySchema = z.object({ prompt: z.string() }).strict();

    const bodyResult = bodySchema.safeParse(req.body);

    if (!bodyResult.success) {
      return rep.code(400).send({ error: "Invalid payload" });
    }

    const prompt = bodyResult.data.prompt;

    const video = await prisma.video.findUniqueOrThrow({
      where: { id: videoId },
    });

    const videoPath = video.path;

    const audioReadStream = fs.createReadStream(videoPath);

    const response = await openai.audio.transcriptions
      .create({
        file: audioReadStream,
        model: "whisper-1",
        language: "pt",
        response_format: "json",
        temperature: 0,
        prompt,
      })
      .catch((e) => console.log(e));

    return rep.send({ videoId, prompt, videoPath, transcription: response });
  });
};
