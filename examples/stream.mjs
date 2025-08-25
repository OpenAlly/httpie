// Node.js Dependencies
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Third-party Dependencies
import * as httpie from "../dist/index.js";
// import * as httpie from "@openally/httpie";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kGithubURL = new URL("https://github.com/");

const agent = new httpie.Agent(
  httpie.interceptors.redirect({ maxRedirections: 2 })
);
const cursor = httpie.stream(
  "GET",
  new URL("NodeSecure/vulnera/archive/main.tar.gz", kGithubURL),
  { agent }
);

const writable = fs.createWriteStream(path.join(__dirname, "archive.tar.gz"));

let code;
let contentType;
await cursor(({ statusCode, headers }) => {
  code = statusCode;
  contentType = headers["content-type"];

  return writable;
});

console.log(code, contentType);
