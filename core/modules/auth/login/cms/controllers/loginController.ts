import { renderFileToString } from "dejs";
import vs from "value_schema";
import loginSchema from "../../schemas/loginSchema.ts";
import { Status } from "oak";
import userToken from "../../../../../../shared/utils/tokens/userToken.ts";
import hash from "../../../../../../shared/utils/hashes/bcryptHash.ts";
import userService from "../../../../../../repositories/mongodb/user/userRepository.ts";
import currentUserSession from "../../../../../../shared/utils/sessions/currentUserSession.ts";
import cmsErrors from "../../../../../../shared/utils/errors/cms/cmsErrors.ts";

export default {
  async login(context: Record<string, any>) {
    try {
      context.response.body = await renderFileToString(
        `${Deno.cwd()}${Deno.env.get("THEME")}templates/auth/loginView.ejs`,
        {
          message: "",
        }
      );
    } catch (error) {
      await cmsErrors.NotFoundError(context, Status.NotFound, error);
      return;
    }
  },

  async loginPost(context: Record<string, any>) {
    try {
      if (!context.request.hasBody) {
        context.throw(Status.BadRequest, "Bad Request");
      }

      let body = await context.request.body();

      if (body.type !== "form") {
        context.throw(Status.BadRequest, "Bad Request");
      }

      let bodyValue = await body.value;
      let validated: any;
      let logged: boolean | undefined;
      let email = bodyValue.get("email");
      let password = bodyValue.get("password");

      validated = vs.applySchemaObject(loginSchema, { email, password });

      let user: any | undefined;

      if (validated) {
        user = await userService.findOneByEmail(validated.email);

        if (user && user.status) {
          logged = await hash.verify(user.password, validated.password);
        }
      }

      if (user && logged) {
        let token: string = await userToken.generate(user._id.$oid);
        delete user.password;
        context.cookies.set("jwt", token);
        currentUserSession.set(context, user);
        context.response.redirect("/");
        return;
      }

      context.response.body = await renderFileToString(
        `${Deno.cwd()}${Deno.env.get("THEME")}templates/auth/loginView.ejs`,
        {
          message: "Wrong login or email.",
        }
      );
      return;
    } catch (error) {
      context.response.body = await renderFileToString(
        `${Deno.cwd()}${Deno.env.get("THEME")}templates/auth/loginView.ejs`,
        {
          message: error.message,
        }
      );
      return;
    }
  },

  async logout(context: Record<string, any>) {
    try {
      context.cookies.delete("jwt");
      await currentUserSession.reset(context);
      context.response.redirect("/");
      return;
    } catch (error) {
      await cmsErrors.NotFoundError(context, Status.NotFound, error);
      return;
    }
  },
};
