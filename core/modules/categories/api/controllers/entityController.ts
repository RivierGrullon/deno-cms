import {
  Status,
} from "oak";
import entityRepository from "../../../../../repositories/mongodb/entity/entityRepository.ts";
import entity from "../../entity.ts";
import apiErrors from "../../../../../shared/utils/errors/api/apiErrors.ts";

const repository = entityRepository.getRepository(entity.bundle);

export default {
  async view(context: Record<string, any>) {
    try {
      let id: string | undefined;
      id = context.params.id;
      let term: any | undefined;

      if (id) {
        term = await repository.findOneByID(id, entity.type);
      } else {
        term = await repository.find(entity.type);
      }

      if (term && Object.keys(term).length != 0) {
        context.response.body = term;
        context.response.type = "json";
        return;
      }
      context.throw(Status.BadRequest, "Bad Request");
    } catch (error) {
      await apiErrors.genericError(context, Status.BadRequest, error);
    }
  },
};
