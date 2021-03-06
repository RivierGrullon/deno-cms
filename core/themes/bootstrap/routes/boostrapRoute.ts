import router from "../../../router.ts";

router
  .get(
    "/favicon.png",
    async (context: Record<string, any>) => {
      context.response.headers.set("Content-Type", "image/png");
      context.response.body = await Deno.readFile(
        `${Deno.cwd()}/core/themes/bootstrap/favicon.png`,
      );
    },
  )
  .get(
    "/core/themes/boostrap/assets/:folder/:file",
    async (context: Record<string, any>) => {
      let folder = context.params.folder;
      let file = context.params.file;
      let ext = file?.split(".").pop();

      if (ext == "css") {
        context.response.headers.set("Content-Type", "text/css");
      }

      if (ext == "js") {
        context.response.headers.set("Content-Type", "application/javascript");
      }

      context.response.body = await Deno.readFile(
        `${Deno.cwd()}/core/themes/bootstrap/assets/${folder}/${file}`,
      );
    },
  );

export default router;
