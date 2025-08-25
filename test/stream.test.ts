// Import Node.js Dependencies
import { describe, it, before, after } from "node:test";
import { createWriteStream, createReadStream, existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import assert from "node:assert";

// Import Third-party Dependencies
import { FastifyInstance } from "fastify";

// Import Internal Dependencies
import * as httpie from "../src/index";
import { createServer } from "./server/index";

// CONSTANTS
const __dirname = import.meta.dirname;

const kGithubURL = new URL("https://github.com/");
const kFixturesPath = path.join(__dirname, "fixtures");
const kDownloadPath = path.join(__dirname, "download");

let httpServer: FastifyInstance;
before(async() => {
  httpServer = await createServer("stream", 1338);
  await fs.mkdir(kDownloadPath, { recursive: true });
});

after(async() => {
  await httpServer.close();
  await fs.rm(kDownloadPath, { force: true, recursive: true });
});

describe("stream", () => {
  it("should use callback dispatcher to init headers/statusCode etc.", async() => {
    const fileDestination = path.join(kDownloadPath, "fs-walk-main.tar.gz");
    const repositoryURL = new URL("NodeSecure/vulnera/archive/main.tar.gz", kGithubURL);

    const agent = new httpie.Agent()
      .compose(httpie.interceptors.redirect({ maxRedirections: 1 }));
    const cursor = httpie.stream("GET", repositoryURL, {
      headers: {
        "User-Agent": "httpie",
        "Accept-Encoding": "gzip, deflate"
      },
      agent
    });

    let contentType = "";
    let code = 0;
    await cursor(({ headers, statusCode }) => {
      contentType = headers["content-type"] as string;
      code = statusCode;

      return createWriteStream(fileDestination);
    });

    assert.ok(existsSync(fileDestination));
    assert.equal(contentType, "application/x-gzip");
    assert.equal(code, 200);
  });

  it("should fetch a .tar.gz of a given github repository", async() => {
    const fileDestination = path.join(kDownloadPath, "vulnera-main.tar.gz");
    const repositoryURL = new URL("NodeSecure/vulnera/archive/main.tar.gz", kGithubURL);

    const agent = new httpie.Agent()
      .compose(httpie.interceptors.redirect());
    await httpie.stream("GET", repositoryURL, {
      headers: {
        "User-Agent": "httpie",
        "Accept-Encoding": "gzip, deflate"
      },
      agent
    })(() => createWriteStream(fileDestination));

    assert.ok(existsSync(fileDestination));
  });

  it("should fetch the HTML home from the local fastify server", async() => {
    const fileDestination = path.join(kDownloadPath, "home.html");

    await httpie.stream("GET", "/stream/home")(() => createWriteStream(fileDestination));

    assert.ok(existsSync(fileDestination));
    const [contentA, contentB] = await Promise.all([
      fs.readFile(path.join(kFixturesPath, "home.html"), "utf-8"),
      fs.readFile(path.join(kDownloadPath, "home.html"), "utf-8")
    ]);

    assert.equal(contentA, contentB);
  });
});

describe("pipeline", () => {
  it("should be able to pipeline (duplex stream)", async() => {
    const fixtureLocation = path.join(kFixturesPath, "lorem.txt");
    const fileDestination = path.join(kDownloadPath, "lorem.txt");

    await pipeline(
      createReadStream(fixtureLocation),
      httpie.pipeline("GET", "/stream/pipeline"),
      createWriteStream(fileDestination)
    );

    assert.ok(existsSync(fileDestination));
    const [contentA, contentB] = await Promise.all([
      fs.readFile(fixtureLocation, "utf-8"),
      fs.readFile(fileDestination, "utf-8")
    ]);

    assert.equal(contentA.toUpperCase(), contentB);
  });
});
