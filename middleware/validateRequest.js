import Joi from 'joi';
import AppError from './AppError.js';

const objectId = Joi.string().pattern(/^[a-f\d]{24}$/i).required();
const email = Joi.string().trim().email().lowercase();
const password = Joi.string().trim().min(6).max(128);
const optionalText = Joi.string().trim().max(2000).allow('');
const optionalPrice = Joi.number().min(0).allow('', null);

export const requestSchemas = {
  authRegister: Joi.object({
    username: Joi.string().trim().min(1).max(100).required(),
    password: password.required()
  }),
  authLogin: Joi.object({
    username: Joi.string().trim().min(1).max(100).required(),
    password: Joi.string().trim().min(1).max(128).required()
  }),
  familyRegister: Joi.object({
    email,
    username: email,
    password: password.required()
  }).or('email', 'username'),
  familyLogin: Joi.object({
    email,
    username: email,
    password: Joi.string().trim().min(1).max(128).required()
  }).or('email', 'username'),
  portalQuery: Joi.object({ email: email.required() }),
  downloadQuery: Joi.object({ filePath: Joi.string().trim().min(1).max(2048).required() }),
  familyCreate: Joi.object({
    familyName: Joi.string().trim().min(1).max(200).required(),
    fatherName: optionalText,
    motherName: optionalText,
    fatherPhone: Joi.string().trim().max(50).allow(''),
    motherPhone: Joi.string().trim().max(50).allow(''),
    email: email.allow(''),
    paymentStatus: Joi.boolean().truthy('true').falsy('false'),
    notes: optionalText,
    familyCode: Joi.string().trim().max(100).allow('')
  }),
  familyUpdate: Joi.object({
    familyName: Joi.string().trim().max(200).allow(''),
    fatherName: optionalText,
    motherName: optionalText,
    fatherPhone: Joi.string().trim().max(50).allow(''),
    motherPhone: Joi.string().trim().max(50).allow(''),
    email: email.allow(''),
    paymentStatus: Joi.boolean().truthy('true').falsy('false'),
    notes: optionalText,
    familyCode: Joi.string().trim().max(100).allow('')
  }),
  fileDelete: Joi.object({ filePath: Joi.string().trim().min(1).max(2048).required() }),
  paymentStatus: Joi.object({ paymentStatus: Joi.boolean().truthy('true').falsy('false').required() }),
  childCreate: Joi.object({
    name: Joi.string().trim().min(1).max(200).required(),
    grade: Joi.string().trim().max(200).allow(''),
    customPrice: optionalPrice,
    price: optionalPrice
  }),
  childUpdate: Joi.object({
    name: Joi.string().trim().min(1).max(200),
    grade: Joi.string().trim().max(200).allow(''),
    customPrice: optionalPrice,
    price: optionalPrice
  }).min(1),
  familyParams: Joi.object({ id: objectId }),
  childParams: Joi.object({ id: objectId, childId: objectId })
};

export function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      convert: true
    });

    if (error) {
      return next(new AppError(400, 'הנתונים שנשלחו אינם תקינים', error.details.map(detail => detail.message)));
    }

    Object.defineProperty(req, source, {
      configurable: true,
      enumerable: true,
      writable: true,
      value
    });
    next();
  };
}