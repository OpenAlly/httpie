// Import Node.js Dependencies
import path from "node:path";
import fs from "node:fs";
import { Transform } from "node:stream";

// Import Third-party Dependencies
import fastify from "fastify";
import * as undici from "undici";

// Import Internal Dependencies
import { CustomHttpAgent, agents } from "../../src/agents";

// CONSTANTS
const __dirname = import.meta.dirname;
const kFixturesPath = path.join(__dirname, "..", "fixtures");

const toUpperCase = new Transform({
  transform(chunk, _enc, next) {
    for (let id = 0; id < chunk.length; id++) {
      const char = chunk[id];
      chunk[id] = char < 97 || char > 122 ? char : char - 32;
    }

    this.push(chunk);
    next();
  }
});

export async function createServer(customPath = "local", port = 3000) {
  const server = fastify({ logger: false });
  const serverAgent: CustomHttpAgent = {
    customPath,
    agent: new undici.Agent({
      connections: 10
    }),
    origin: `http://localhost:${port}/`
  };
  agents.add(serverAgent);

  server.get("/", async() => {
    return {
      uptime: process.uptime()
    };
  });

  server.get("/qs", async(request) => request.query);

  server.get("/home", (_request, reply) => {
    reply.send(
      fs.createReadStream(path.join(kFixturesPath, "home.html"))
    );
  });

  server.get("/pipeline", (request, reply) => {
    reply.send(
      request.raw.pipe(toUpperCase)
    );
  });

  server.get("/redirect", (_request, reply) => {
    reply.redirect("/");
  });

  server.get("/jsonError", (_request, reply) => {
    reply.type("application/json");
    reply.send("{ 'foo': bar }");
  });

  server.get("/notimplemented", (_request, reply) => {
    reply.code(501);
    reply.send();
  });

  server.get("/internalerror", (_request, reply) => {
    reply.code(500);
    reply.send();
  });

  server.get("/badEncoding", (_request, reply) => {
    reply.header("content-encoding", "oui");
    reply.send("{ 'foo': bar }");
  });

  server.get("/pdf", (_request, reply) => {
    reply.header("content-type", "application/pdf");
    reply.send("{ 'foo': bar }");
  });

  server.get("/text", (_request, reply) => {
    reply.header("content-type", "text/anything");
    reply.send("text");
  });

  await server.listen({ port });

  return server;
}

