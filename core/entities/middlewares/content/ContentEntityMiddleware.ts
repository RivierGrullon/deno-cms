import { ContentEntity } from "../../src/ContentEntity.ts";
import { Status } from "oak";
import vs from "value_schema";
import pathauto from "../../../../shared/utils/pathauto/defaultPathauto.ts";
import entityReferenceHelper from "../../../modules/entity_reference/helpers/entityReferenceHelper.ts";
import cmsErrors from "../../../../shared/utils/errors/cms/cmsErrors.ts";

export default abstract class ContentEntityMiddleware {
  protected entity: any;
  protected repository: any;
  protected entitySchema: any;

  constructor(entity: any, repository: any, entitySchema: any) {
    entity = entity;
    repository = repository;
    entitySchema = entitySchema;
  }

  async add(context: Record<string, any>, next: Function) {
    try {
      let id: string = context.params?.id;
      let content: {} | undefined;

      if (id) {
        content = await this.repository.findOneByID(id);
      }

      let page = {
        content: content,
        entity: this.entity,
        error: false,
        message: false,
      };

      context["getPage"] = page;
      await next();
    } catch (error) {
      await cmsErrors.NotFoundError(context, Status.NotFound, error);
      return;
    }
  }

  async addPost(context: Record<string, any>, next: Function) {
    let title: string;
    let published: boolean = false;
    let page: any;
    let content: ContentEntity | undefined;
    let id: string = "";

    try {
      let data: any = {};
      let body = context.getBody;
      let currentUser = context.getCurrentUser;

      let bodyValue = await body.value;
      let validated: any;

      id = bodyValue.get("id");
      title = bodyValue.get("title");
      published = bodyValue.get("published") ? true : false;

      if (this.entity.fields.length > 0) {
        this.entity.fields.forEach(function (field: string) {
          data[field] = bodyValue.get(field);
        });
      }

      if (this.entity.references.length > 0) {
        context["getRelation"] = {
          entity: {},
          references: [],
        };

        let entities = await entityReferenceHelper.addEntityRelation(
          this.entity.references,
          context
        );

        Object.keys(entities).map((field) => {
          data[field] = entities[field];
          context["getRelation"]["references"].push(data[field]);
        });
      }

      validated = vs.applySchemaObject(this.entitySchema, {
        title: title,
        data: data,
        published: published,
      });

      let path: string | undefined;
      let pathPattern: any[] = new Array();

      if (validated) {
        this.entity.pathPattern.forEach((p: any) => {
          if (typeof p === "string" && p.charAt(0) == ":") {
            pathPattern.push(validated[p.substr(1)]);
            return;
          }

          pathPattern.push(p);
        });

        path = await pathauto.generate(this.entity.bundle, pathPattern, id);

        content = new ContentEntity(
          validated.data,
          validated.title,
          this.entity.type,
          currentUser,
          Date.now(),
          validated.published,
          path
        );

        if (id) {
          await this.repository.updateOne(id, content);
        } else {
          let result = await this.repository.insertOne(content);
          id = result.$oid;
        }

        if (this.entity.references.length > 0) {
          context["getRelation"]["entity"] = {
            id: id,
            bundle: this.entity.bundle,
            type: this.entity.type,
          };
        }

        page = {
          id: id,
          content: content,
          entity: this.entity,
          error: false,
          message: false,
        };

        context["getPage"] = page;
        context["getRedirect"] = path;
        await next();
        return;
      }
      context.throw(Status.NotAcceptable, "Not Acceptable");
    } catch (error) {
      console.log(error.message);

      if (id) {
        content = (await this.repository.findOneByID(id)) as ContentEntity;
      }

      page = {
        id: id,
        content: content,
        entity: this.entity,
        error: true,
        message: error.message,
      };

      context["getPage"] = page;
      await next();
    }
  }

  async view(context: Record<string, any>, next: Function) {
    try {
      let path: string = context.request.url.pathname;
      let content: any | undefined;

      content = await this.repository.findOneByFilters({ path: path });

      if (content && Object.keys(content).length != 0) {
        let page = {
          content: content,
          entity: this.entity,
          error: false,
          message: false,
        };

        context["getPage"] = page;
        await next();
        return;
      }
      context.throw(Status.NotFound, "NotFound");
    } catch (error) {
      await cmsErrors.NotFoundError(context, Status.NotFound, error);
      return;
    }
  }

  async delete(context: Record<string, any>, next: Function) {
    try {
      let id: string = context.params.id;
      let content: any | undefined;
      content = await this.repository.findOneByID(id);

      if (content && Object.keys(content).length != 0) {
        let page = {
          content: content,
          entity: this.entity,
          error: false,
          message: false,
        };

        context["getPage"] = page;
        await next();
        return;
      }
      context.throw(Status.NotFound, "NotFound");
    } catch (error) {
      await cmsErrors.NotFoundError(context, Status.NotFound, error);
      return;
    }
  }

  async deletePost(context: Record<string, any>, next: Function) {
    let path = `/admin/${this.entity.bundle}`;
    let content: any | undefined;
    let id: string = "";

    try {
      let body = context.getBody;
      let bodyValue = await body.value;

      id = bodyValue.get("id");
      content = await this.repository.findOneByID(id);

      if (this.entity.references.length > 0) {
        context["getRelation"] = {
          entity: {},
        };
      }

      if (content && Object.keys(content).length != 0) {
        await this.repository.deleteOne(id);

        if (this.entity.references.length > 0) {
          context["getRelation"]["entity"] = {
            id: id,
            bundle: this.entity.bundle,
            type: this.entity.type,
          };
        }
      }

      let page = {
        id: id,
        content: content,
        entity: this.entity,
        error: false,
        message: false,
      };

      context["getPage"] = page;
      context["getRedirect"] = path;
      await next();
    } catch (error) {
      console.log(error.message);

      let page = {
        id: id,
        content: content,
        entity: this.entity,
        error: true,
        message: true,
      };

      context["getPage"] = page;
      context["getRedirect"] = path;
      await next();
    }
  }
}
