import Joi from "joi";

// Login validation
export const loginSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});
