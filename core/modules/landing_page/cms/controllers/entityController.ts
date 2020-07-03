import { renderFileToString } from "dejs";
import {
  ContentEntity,
} from "../../../../entities/ContentEntity.ts";
import {
  Status,
} from "oak";
import vs from "value_schema";
import entitySchema from "../../schemas/entitySchema.ts";
import entityRepository from "../../../../../repositories/mongodb/entity/entityRepository.ts";
import entity from "../../entity.ts";
import cmsErrors from "../../../../../shared/utils/errors/cms/cmsErrors.ts";
import entityReferenceHelper from "../../../entity_reference/utils/entityReferenceHelper.ts";
import currentUserSession from "../../../../../shared/utils/sessions/currentUserSession.ts";

const repository = entityRepository.getRepository(entity.bundle);

export default {
  async add(context: Record<string, any>) {
    try {
      let currentUser = context.getCurrentUser;
      let id: string = context.params?.id;
      let content: any | undefined;

      if (id) {
        content = await repository.findOneByID(id);

        let references: any = [
          "references",
        ];

        let referenceValues = new Array();

        for (let field of references) {
          let entities = new Array();
          referenceValues = content.data[field as string];

          if (referenceValues && referenceValues.length > 0) {
            for (let value of referenceValues) {
              let loadedEntity: any = await entityReferenceHelper.entityLoad(
                value.entity._id.$oid,
                value.entity.bundle,
              );

              if (Object.keys(loadedEntity).length != 0) {
                value.entity = loadedEntity;
                entities.push(value);
              }
            }
          }

          if (entities.length > 0) {
            content.data[field as string] = entities;
          }
        }
      }

      context.response.body = await renderFileToString(
        `${Deno.cwd()}/core/modules/${entity.type}/cms/views/entityFormView.ejs`,
        {
          currentUser: currentUser,
          message: false,
          content: content,
          entity: entity,
        },
      );
      context.response.status = Status.OK;
      return;
    } catch (error) {
      await cmsErrors.NotFoundError(context, Status.NotFound, error);
      return;
    }
  },

  async addPost(context: Record<string, any>) {
    try {
      let body = context.getBody;
      let currentUser = context.getCurrentUser;
      let validated: any;
      let data: any = {};
      let id: string = body.value.get("id");
      let properties: any = [
        "title",
      ];
      let published: boolean;

      published = body.value.get("published") ? true : false;

      properties.forEach(function (field: string) {
        data[field] = body.value.get(field);
      });

      let references: any = [
        "references",
      ];

      let referenceValues = new Array();

      for (let field of references) {
        let entities = new Array();
        referenceValues = JSON.parse(body.value.get(field));

        if (referenceValues && referenceValues.length > 0) {
          for (let value of referenceValues) {
            let loadedEntity: any = await entityReferenceHelper.entityLoad(
              value.entity._id.$oid,
              value.entity.bundle,
            );

            if (Object.keys(loadedEntity).length != 0) {
              value.entity = loadedEntity;
              entities.push(value);
            }
          }
        }

        if (entities.length > 0) {
          data[field as string] = entities;
        }
      }

      validated = vs.applySchemaObject(
        entitySchema,
        { data: data, published: published },
      );

      let content: ContentEntity | undefined;

      if (validated) {
        content = new ContentEntity(
          validated.data,
          entity.type,
          currentUser,
          Date.now(),
          validated.published,
        );
      }

      if (content && Object.keys(content).length != 0) {
        let result: any;

        if (id) {
          result = await repository.updateOne(id, content);
        } else {
          result = await repository.insertOne(content);
          id = result?.$oid;
        }

        context.response.redirect(`/${entity.type}/${id}`);
        return;
      }

      context.response.body = await renderFileToString(
        `${Deno.cwd()}/core/modules/${entity.type}/cms/views/entityFormView.ejs`,
        {
          currentUser: currentUser,
          message: "Error saving content. Please try again.",
          content: false,
          entity: entity,
        },
      );
      return;
    } catch (error) {
      context.response.body = await renderFileToString(
        `${Deno.cwd()}/core/modules/${entity.type}/cms/views/entityFormView.ejs`,
        {
          currentUser: context.getCurrentUser,
          message: error.message,
          content: false,
          entity: entity,
        },
      );
      context.response.status = Status.OK;
      return;
    }
  },

  async view(context: Record<string, any>) {
    try {
      let currentUser = await currentUserSession.get(context);
      let id: string = context.params.id;
      let content: any | undefined;
      content = await repository.findOneByID(id);

      if (content && Object.keys(content).length != 0) {
        context.response.body = await renderFileToString(
          `${Deno.cwd()}${
            Deno.env.get("THEME")
          }templates/entities/${entity.bundle}/${entity.type}/entityViewDefault.ejs`,
          {
            currentUser: currentUser,
            page: {
              content: content,
            },
          },
        );
        context.response.status = Status.OK;
        return;
      }
      context.throw(Status.NotFound, "NotFound");
    } catch (error) {
      await cmsErrors.NotFoundError(context, Status.NotFound, error);
      return;
    }
  },

  async delete(context: Record<string, any>) {
    try {
      let id: string = context.params.id;
      let content: any | undefined;
      content = await repository.findOneByID(id);

      if (content && Object.keys(content).length != 0) {
        context.response.body = await renderFileToString(
          `${Deno.cwd()}/core/modules/${entity.type}/cms/views/entityFormConfirmDelete.ejs`,
          {
            currentUser: context.getCurrentUser,
            content: content,
          },
        );
        return;
      }

      context.throw(Status.NotFound, "NotFound");
    } catch (error) {
      await cmsErrors.NotFoundError(context, Status.NotFound, error);
      return;
    }
  },

  async deletePost(context: Record<string, any>) {
    try {
      let body = context.getBody;
      let id: string;
      id = body.value.get("id");

      let content: any | undefined;
      content = await repository.findOneByID(id);

      if (content && Object.keys(content).length != 0) {
        await repository.deleteOne(id);
      }
      context.response.redirect(`/admin/${entity.bundle}`);
      return;
    } catch (error) {
      console.log(error);
      context.response.redirect(`/admin/${entity.bundle}`);
      return;
    }
  },
};