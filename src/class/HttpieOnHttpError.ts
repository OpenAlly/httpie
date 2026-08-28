// Import Internal Dependencies
import {
  HttpieError,
  kHttpieErrorBrand,
  type HttpieErrorKind
} from "./HttpieCommonError.js";
import { type RequestResponse } from "../request.js";

/**
 * @description Class to generate an Error with all the required properties from the response.
 * We attach these to the error so that they can be retrieved by the developer in a Catch block.
 */
export class HttpieOnHttpError<
  T extends RequestResponse<any>
> extends HttpieError {
  override name = "HttpieOnHttpError";

  override get [kHttpieErrorBrand](): HttpieErrorKind {
    return "HttpieOnHttpError";
  }

  statusMessage: string;
  data: T["data"];

  constructor(response: T) {
    super(response.statusMessage, { response });

    this.statusMessage = response.statusMessage;
    this.data = response.data;
  }
}
