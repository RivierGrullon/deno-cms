import router from "../../../../router.ts";
import entityController from "../controllers/entityController.ts";
import loggedMiddleware from "../../../../../shared/middlewares/loggedMiddleware.ts";
import entity from "../../entity.ts";
import baseEntityMiddleware from "../../../../../shared/middlewares/baseEntityMiddleware.ts";
import cmsMiddleware from "../../../../../shared/middlewares/cmsMiddleware.ts";

router
  .get(
    `/admin/taxonomy/${entity.type.replace("_", "-")}`,
    loggedMiddleware.needToBeLogged,
    entityController.list,
  )
  .get(
    `/admin/taxonomy/${entity.type.replace("_", "-")}/add`,
    loggedMiddleware.needToBeLogged,
    entityController.add,
  )
  .get(
    `/admin/taxonomy/${entity.type.replace("_", "-")}/edit/:id`,
    loggedMiddleware.needToBeLogged,
    baseEntityMiddleware.needToBeTaxonomyAuthor,
    entityController.add,
  )
  .get(
    `/taxonomy/${entity.type.replace("_", "-")}/:id`,
    baseEntityMiddleware.taxonomyNeedToBePublished,
    entityController.view,
  )
  .post(
    `/admin/taxonomy/${entity.type.replace("_", "-")}/add`,
    loggedMiddleware.needToBeLogged,
    cmsMiddleware.submittedByForm,
    entityController.addPost,
  )
  .get(
    `/admin/taxonomy/${entity.type.replace("_", "-")}/delete/:id`,
    loggedMiddleware.needToBeLogged,
    baseEntityMiddleware.needToBeTaxonomyAuthor,
    entityController.delete,
  )
  .post(
    `/admin/taxonomy/${entity.type.replace("_", "-")}/delete`,
    loggedMiddleware.needToBeLogged,
    baseEntityMiddleware.needToBeTaxonomyAuthor,
    cmsMiddleware.submittedByForm,
    entityController.deletePost,
  );

export default router;
