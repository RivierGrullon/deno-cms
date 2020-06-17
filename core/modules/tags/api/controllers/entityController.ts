import {
  Status,
} from "oak";
import taxonomyRepository from "../../../../../repositories/mongodb/taxonomy/taxonomyRepository.ts";
import entity from "../../entity.ts";

export default {
  async view(context: Record<string, any>) {
    try {
      let id: string | undefined;
      id = context.params.id;
      let term: any | undefined;

      if (id) {
        term = await taxonomyRepository.findOneByID(id, entity.type);
      } else {
        term = await taxonomyRepository.find(entity.type);
      }

      if (term && Object.keys(term).length != 0) {
        context.response.body = term;
        context.response.type = "json";
        return;
      }
      context.throw(Status.BadRequest, "Bad Request");
    } catch (error) {
      console.log(error);
      context.response.body = { error: error.message };
      context.response.status = Status.BadRequest;
      context.response.type = "json";
    }
  },
};