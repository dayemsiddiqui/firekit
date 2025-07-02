import { BaseJob } from 'adonis-resque'
import logger from '@adonisjs/core/services/logger'

export default class HelloWorld extends BaseJob {
  perform() {
    logger.info('Hello World, async from the user job')
  }
}
