import { renderFileToString } from "dejs";
import currentUserSession from "../../../../../../shared/utils/sessions/currentUserSession.ts";
import {
  ContentEntity,
  TContentEntity,
} from "../../../../../entities/ContentEntity.ts";
import {
  Status,
} from "oak";
import vs from "value_schema";
import basicPageSchema from "../../schemas/basicPageSchema.ts";
import contentRepository from "../../../../../../repositories/mongodb/content/contentRepository.ts";

export default {
  async add(context: Record<string, any>) {
    context.response.body = await renderFileToString(
      `${Deno.cwd()}/core/modules/admin/basic_page/cms/views/basicPageFormView.ejs`,
      {
        currentUser: await currentUserSession.get(context),
        message: false,
      },
    );
  },

  async addPost(context: Record<string, any>) {
    try {
      if (!context.request.hasBody) {
        context.throw(Status.BadRequest, "Bad Request");
      }

      const body = await context.request.body();

      if (body.type !== "form") {
        context.throw(Status.BadRequest, "Bad Request");
      }

      let content: ContentEntity | undefined;
      let validated: { title: string };
      let data: any = {};
      let properties: any = [
        "title",
        "body",
      ];

      properties.forEach(function (field: string) {
        data[field] = body.value.get(field);
      });

      validated = vs.applySchemaObject(
        basicPageSchema,
        { title: data.title },
      );

      if (validated) {
        content = new ContentEntity(
          data as TContentEntity,
          "basic_page",
          await currentUserSession.get(context),
          Date.now(),
        );
      }

      if (content) {
        let result = await contentRepository.insertOne(content);
        context.response.redirect(`/basic-page/${result.$oid}`);
        return;
      }

      context.response.body = await renderFileToString(
        `${Deno.cwd()}/core/modules/admin/basic_page/cms/views/basicPageFormView.ejs`,
        {
          currentUser: await currentUserSession.get(context),
          message: "Error saving content. Please try again.",
        },
      );
      return;
    } catch (error) {
      context.response.body = await renderFileToString(
        `${Deno.cwd()}/core/modules/admin/basic_page/cms/views/basicPageFormView.ejs`,
        {
          currentUser: await currentUserSession.get(context),
          message: error.message,
        },
      );
    }
  },

  async view(context: Record<string, any>) {
    try {
      const id: string = context.params.id;
      let content: {} | undefined;
      content = await contentRepository.findOneByID(id);
      context.response.body = await renderFileToString(
        `${Deno.cwd()}/core/modules/admin/basic_page/cms/views/basicPageView.ejs`,
        {
          currentUser: await currentUserSession.get(context),
          content: content,
        },
      );
    } catch (error) {
      context.response.status = Status.NotFound;
      context.response.body = await renderFileToString(
        `${Deno.cwd()}/core/modules/unknownPages/views/notFound.ejs`,
        {},
      );
    }
  },
};
