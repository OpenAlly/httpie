import * as httpie from "../dist/index.js";
// import * as httpie from "@openally/httpie";

const { data } = await httpie.get("https://jsonplaceholder.typicode.com/posts");
console.log(data);
