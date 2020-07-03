import vs from "value_schema";

const entitySchema = {
  data: vs.object({
    schemaObject: {
      title: vs.string({
        maxLength: {
          length: 150,
          trims: true,
        },
      }),
      image: vs.string(),
    },
  }),
  published: vs.boolean({ ifUndefined: false }),
};

export default entitySchema;