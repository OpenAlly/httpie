import * as httpie from "../dist/index.js";
// import * as httpie from "@openally/httpie";

const yoda = {
  customPath: "yoda",
  agent: new httpie.Agent({
    connections: 500
  }),
  origin: "https://yoda.myunisoft.fr:1407"
};
httpie.agents.add(yoda);

const { data } = await httpie.get("/yoda/api/v1/ipa/healthz");
console.log(data);
