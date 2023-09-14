import type { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import path from "node:path";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
import fs from "node:fs";
import { prisma } from "../lib/prisma";

const pump = promisify(pipeline);

export const uploadVideoRoute = async (app: FastifyInstance) => {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 25, // 25mb
    },
  });

  app.post("/videos", async (req, rep) => {
    const data = await req.file();

    if (!data) {
      return rep.code(400).send({ error: "Missing file input." });
    }

    const extension: string = path.extname(data.filename);
    if (extension !== ".mp3") {
      return rep
        .code(400)
        .send({ error: "Invalid input type. Please upload a mp3 file." });
    }

    const fileBaseName = path.basename(data.filename, extension);
    const fileUploadName = `${fileBaseName}-${crypto.randomUUID()}${extension}`;

    const uploadDestination = path.resolve(
      __dirname,
      "../../tmp",
      fileUploadName,
    );

    await pump(data.file, fs.createWriteStream(uploadDestination));

    const video = await prisma.video.create({
      data: { name: data.filename, path: uploadDestination },
    });

    return rep.code(201).send({ video });
  });
};
