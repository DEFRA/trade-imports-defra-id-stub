import Joi from 'joi'
import { DEFAULT_ERROR_STATUS, DEFAULT_RETRY_AFTER_SECONDS, FAULT_KINDS } from './faults.js'

const MIN_ERROR_STATUS = 500
const MAX_ERROR_STATUS = 599
const MAX_EXPIRY_SECONDS = 86_400
const DELAYED_KINDS = ['slow', 'hang']

/** The body of `PUT /faults/{integration}`. */
export const faultSchema = Joi.object({
  kind: Joi.string().valid(...FAULT_KINDS).required(),
  rate: Joi.number().min(0).max(1).required(),
  delayMs: Joi.number().integer().min(0).when('kind', { is: Joi.valid(...DELAYED_KINDS), then: Joi.required() }),
  status: Joi.number().integer().min(MIN_ERROR_STATUS).max(MAX_ERROR_STATUS).default(DEFAULT_ERROR_STATUS),
  retryAfterSeconds: Joi.number().integer().min(1).default(DEFAULT_RETRY_AFTER_SECONDS),
  paths: Joi.array().items(Joi.string()),
  expiresInSeconds: Joi.number().integer().min(1).max(MAX_EXPIRY_SECONDS).required()
})
